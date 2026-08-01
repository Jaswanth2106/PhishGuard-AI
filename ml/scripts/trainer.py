import os
import json
import time
import tracemalloc
import logging
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.pipeline import FeatureUnion
from scipy.sparse import hstack
import lightgbm as lgb

# Reproducibility
SEED = 42
np.random.seed(SEED)

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Trainer")

BASE_DIR = Path(__file__).parent.parent
INPUT_FILE = BASE_DIR / "data" / "processed" / "engineered_dataset.csv"
REPORTS_DIR = BASE_DIR / "reports"
MODELS_DIR = BASE_DIR.parent / "backend" / "app" / "ml_models"

def load_and_split():
    df = pd.read_csv(INPUT_FILE)
    df['cleaned_body'] = df['cleaned_body'].fillna('')
    
    # 80/10/10 Split
    X = df['cleaned_body']
    y = df['label']
    
    X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.1, random_state=SEED, stratify=y)
    X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.1111, random_state=SEED, stratify=y_train_val)
    
    logger.info(f"Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test

def train_and_evaluate(model, name, X_train, y_train, X_test, y_test):
    logger.info(f"Training {name}...")
    
    tracemalloc.start()
    start_time = time.time()
    
    # Train
    model.fit(X_train, y_train)
    
    train_time = time.time() - start_time
    _, peak_memory = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    # Inference Time
    inf_start = time.time()
    preds = model.predict(X_test)
    inf_time = (time.time() - inf_start) / X_test.shape[0] * 1000 # in ms
    
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_test)[:, 1]
    elif hasattr(model, "decision_function"):
        probs = model.decision_function(X_test)
    else:
        probs = preds
        
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    
    try:
        roc = roc_auc_score(y_test, probs)
    except ValueError:
        roc = 0.0 # Handle case where only 1 class in test
        
    cm = confusion_matrix(y_test, preds)
    fn = cm[1][0] if cm.shape == (2,2) else 0
    
    # Temporarily save model to check size
    temp_path = f"temp_{name.replace(' ', '_')}.pkl"
    joblib.dump(model, temp_path)
    model_size_mb = os.path.getsize(temp_path) / (1024 * 1024)
    os.remove(temp_path)
    
    return {
        "model": model,
        "metrics": {
            "Algorithm": name,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1": f1,
            "ROC-AUC": roc,
            "False_Negatives": int(fn),
            "Training_Time_s": round(train_time, 4),
            "Inference_Time_ms": round(inf_time, 4),
            "Peak_Memory_MB": round(peak_memory / (1024 * 1024), 2),
            "Model_Size_MB": round(model_size_mb, 2)
        }
    }

def main():
    logger.info("Starting Phase 2.4 - Model Benchmarking & Training")
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Split
    X_train, X_val, X_test, y_train, y_val, y_test = load_and_split()
    
    # 2. TF-IDF
    logger.info("Fitting TF-IDF Vectorizer on Training Set ONLY...")
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    # Note: Validation set (X_val) is transformed here during real hyperparameter tuning.
    
    # 3. Models
    models_to_test = [
        (MultinomialNB(), "Multinomial Naive Bayes"),
        (LogisticRegression(max_iter=1000, class_weight='balanced', random_state=SEED), "Logistic Regression"),
        (LinearSVC(class_weight='balanced', random_state=SEED, dual='auto'), "Linear SVM"),
        (lgb.LGBMClassifier(random_state=SEED, class_weight='balanced', n_jobs=1), "LightGBM")
    ]
    
    results = []
    trained_models = {}
    
    for model, name in models_to_test:
        try:
            res = train_and_evaluate(model, name, X_train_vec, y_train, X_test_vec, y_test)
            results.append(res["metrics"])
            trained_models[name] = res["model"]
        except Exception as e:
            logger.error(f"Failed to train {name}: {e}")
            
    # 4. Generate Benchmark Table
    bench_df = pd.DataFrame(results)
    bench_df.to_csv(REPORTS_DIR / "benchmark_results.csv", index=False)
    logger.info(f"\n{bench_df.to_string()}")
    
    # 5. Model Selection Rules
    # Rule 1: Highest F1
    best_f1_idx = bench_df['F1'].idxmax()
    best_f1_model = bench_df.loc[best_f1_idx]
    
    # Rule 2: Complexity Justification
    # If a linear model (LR or SVM) is within 1% F1 of LightGBM but faster/smaller, pick the linear model.
    linear_models = bench_df[bench_df['Algorithm'].isin(["Logistic Regression", "Linear SVM"])]
    advanced_models = bench_df[bench_df['Algorithm'].isin(["LightGBM", "XGBoost"])]
    
    winning_model_name = best_f1_model['Algorithm']
    
    if not advanced_models.empty and winning_model_name in ["LightGBM", "XGBoost"]:
        # Best model is advanced. Let's see if a linear model is "good enough"
        for _, row in linear_models.iterrows():
            f1_diff = best_f1_model['F1'] - row['F1']
            if f1_diff <= 0.01:
                # Within 1%. Check if it's faster or smaller.
                if row['Inference_Time_ms'] < best_f1_model['Inference_Time_ms'] or row['Model_Size_MB'] < best_f1_model['Model_Size_MB']:
                    winning_model_name = row['Algorithm']
                    logger.info(f"Complexity rule triggered! Overriding {best_f1_model['Algorithm']} with {winning_model_name} (Within 1% F1, highly efficient).")
                    break
                    
    logger.info(f"*** Selected Production Model: {winning_model_name} ***")
    
    # 6. Export ONLY the winning model
    final_model = trained_models[winning_model_name]
    joblib.dump(final_model, MODELS_DIR / "model.pkl")
    joblib.dump(vectorizer, MODELS_DIR / "vectorizer.pkl")
    
    logger.info(f"Exported model.pkl and vectorizer.pkl to {MODELS_DIR}")
    
    # Save selection report
    report = {
        "timestamp": time.time(),
        "selected_model": winning_model_name,
        "metrics": bench_df[bench_df['Algorithm'] == winning_model_name].to_dict('records')[0],
        "justification": "Selected based on strict F1 and complexity rules."
    }
    with open(REPORTS_DIR / "selection_report.json", "w") as f:
        json.dump(report, f, indent=4)
        
if __name__ == "__main__":
    main()
