import pandas as pd
import numpy as np
import time
import os
import json
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import FeatureUnion
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix
import lightgbm as lgb
try:
    import xgboost as xgb
except ImportError:
    xgb = None

BASE_DIR = Path(__file__).parent.parent
INPUT_CSV = BASE_DIR / "data" / "processed" / "engineered_dataset.csv"
REPORT_DIR = BASE_DIR / "reports"
MODELS_DIR = BASE_DIR / "models"
BENCHMARK_CSV = REPORT_DIR / "benchmark_results.csv"
BENCHMARK_JSON = REPORT_DIR / "benchmark_summary.json"

def get_ram_usage():
    if not PSUTIL_AVAILABLE:
        return 0.0
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def main():
    print("Loading data...")
    df = pd.read_csv(INPUT_CSV)
    
    # 1. Split data (Train 80, Val 10, Test 10) BEFORE TF-IDF
    X = df.drop(columns=['label', 'sender_domain', 'sender', 'subject', 'body', 'date', 'message_id', 'reply_to', 'return_path', 'source'], errors='ignore')
    y = df['label']
    
    X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.1, stratify=y, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=1/9, stratify=y_train_val, random_state=42)
    
    # 2. Fit TF-IDF ONLY on X_train
    print("Setting up vectorizer and pipeline...")
    numeric_features = [col for col in X.columns if col != 'cleaned_body']
    
    text_features = FeatureUnion([
        ('word_tfidf', TfidfVectorizer(analyzer='word', ngram_range=(1, 2), max_features=30000, token_pattern=r'(?u)\b\w+\b')),
        ('char_tfidf', TfidfVectorizer(analyzer='char', ngram_range=(3, 5), max_features=20000))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('text', text_features, 'cleaned_body'),
            ('num', StandardScaler(), numeric_features)
        ]
    )
    
    preprocessor_nb = ColumnTransformer(
        transformers=[
            ('text', text_features, 'cleaned_body'),
            ('num', MinMaxScaler(), numeric_features)
        ]
    )
    
    print("Fitting preprocessor on training data ONLY...")
    X_train['cleaned_body'] = X_train['cleaned_body'].fillna('')
    X_val['cleaned_body'] = X_val['cleaned_body'].fillna('')
    X_test['cleaned_body'] = X_test['cleaned_body'].fillna('')
    
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_val_transformed = preprocessor.transform(X_val)
    X_test_transformed = preprocessor.transform(X_test)
    
    X_train_nb = preprocessor_nb.fit_transform(X_train)
    X_val_nb = preprocessor_nb.transform(X_val)
    X_test_nb = preprocessor_nb.transform(X_test)
    
    # 3. Define Models
    models = {
        'Naive Bayes': MultinomialNB(),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Linear SVM': LinearSVC(max_iter=2000, random_state=42),
        'LightGBM': lgb.LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1)
    }
    if xgb is not None:
        models['XGBoost'] = xgb.XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss')
        
    results = []
    print("Benchmarking models...")
    for name, model in models.items():
        print(f"Training {name}...")
        xtr, xva, xte = (X_train_nb, X_val_nb, X_test_nb) if name == 'Naive Bayes' else (X_train_transformed, X_val_transformed, X_test_transformed)
        
        # 4. 5-fold CV on Train only
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_res = cross_validate(model, xtr, y_train, cv=cv, scoring='f1', n_jobs=1)
        cv_mean = cv_res['test_score'].mean()
        cv_std = cv_res['test_score'].std()
        
        start_mem = get_ram_usage()
        t0 = time.time()
        model.fit(xtr, y_train)
        t1 = time.time()
        peak_ram = get_ram_usage() - start_mem
        
        t_inf0 = time.time()
        preds = model.predict(xte)
        t_inf1 = time.time()
        
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(xte)[:, 1]
        elif hasattr(model, 'decision_function'):
            probs = model.decision_function(xte)
        else:
            probs = preds
            
        inf_time_per_email = ((t_inf1 - t_inf0) / xte.shape[0]) * 1000 # ms
        
        joblib.dump(model, 'tmp.pkl')
        model_size = os.path.getsize('tmp.pkl') / (1024 * 1024)
        
        res = {
            'Model': name,
            'Accuracy': accuracy_score(y_test, preds),
            'Precision': precision_score(y_test, preds),
            'Recall': recall_score(y_test, preds),
            'F1': f1_score(y_test, preds),
            'ROC_AUC': roc_auc_score(y_test, probs),
            'PR_AUC': average_precision_score(y_test, probs),
            'CV_F1_Mean': cv_mean,
            'CV_F1_Std': cv_std,
            'Train_Time_s': t1 - t0,
            'Inf_Time_ms_per_email': inf_time_per_email,
            'Peak_RAM_MB': max(0, peak_ram),
            'Model_Size_MB': model_size,
            'Confusion_Matrix': confusion_matrix(y_test, preds).tolist()
        }
        results.append(res)
        
    df_res = pd.DataFrame(results)
    
    # 7. Selection Rule (1.5% F1 margin for complex over simple)
    df_res = df_res.sort_values(by='F1', ascending=False)
    
    lgbm_f1 = df_res[df_res['Model'] == 'LightGBM']['F1'].values[0] if 'LightGBM' in df_res['Model'].values else 0
    lr_f1 = df_res[df_res['Model'] == 'Logistic Regression']['F1'].values[0]
    svm_f1 = df_res[df_res['Model'] == 'Linear SVM']['F1'].values[0]
    best_simple_f1 = max(lr_f1, svm_f1)
    
    if lgbm_f1 - best_simple_f1 >= 0.015:
        winning_model_name = 'LightGBM'
    else:
        winning_model_name = 'Logistic Regression' if lr_f1 >= svm_f1 else 'Linear SVM'
        
    print(f"Winning model selected: {winning_model_name}")
    
    winning_model = models[winning_model_name]
    winning_prep = preprocessor_nb if winning_model_name == 'Naive Bayes' else preprocessor
    
    # 8. Export ONLY winning model
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(winning_model, MODELS_DIR / 'model.pkl')
    joblib.dump(winning_prep, MODELS_DIR / 'vectorizer.pkl')
    
    if os.path.exists('tmp.pkl'): os.remove('tmp.pkl')
    
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    df_res_drop_cm = df_res.drop(columns=['Confusion_Matrix'])
    df_res_drop_cm.to_csv(BENCHMARK_CSV, index=False)
    
    summary = {
        'Winning_Model': winning_model_name,
        'Rationale': f"LGBM F1: {lgbm_f1:.4f}, Best Simple F1: {best_simple_f1:.4f}. Rule requires 1.5% margin. Therefore {winning_model_name} won.",
        'Expected_Production_Latency_ms': df_res[df_res['Model'] == winning_model_name]['Inf_Time_ms_per_email'].values[0],
        'Expected_RAM_Usage_MB': df_res[df_res['Model'] == winning_model_name]['Peak_RAM_MB'].values[0],
        'Model_Size_MB': df_res[df_res['Model'] == winning_model_name]['Model_Size_MB'].values[0],
        'Results': df_res.to_dict(orient='records')
    }
    
    with open(BENCHMARK_JSON, "w") as f:
        json.dump(summary, f, indent=4)
        
    print("Benchmark complete.")

if __name__ == '__main__':
    main()
