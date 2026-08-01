import pandas as pd
import unicodedata
import re
import string
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
INPUT_CSV = BASE_DIR / "data" / "processed" / "cleaned_dataset.csv"
OUTPUT_CSV = BASE_DIR / "data" / "processed" / "engineered_dataset.csv"
REPORT_DIR = BASE_DIR / "reports"
REPORT_PATH = REPORT_DIR / "feature_report.json"

# Regex patterns
URL_PATTERN = re.compile(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+|www\.[-\w.]+')
EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
HASH_PATTERN = re.compile(r'\b[a-fA-F0-9]{32,}\b')
HTML_TAG_PATTERN = re.compile(r'<[^>]+>')

# Keywords
ATTACHMENT_KWS = {'attachment', 'attached', 'pdf', 'invoice', 'receipt', 'document', 'file'}
URGENCY_KWS = {'urgent', 'immediate', 'action required', 'act now', 'soon', 'immediately', 'important'}
FINANCIAL_KWS = {'bank', 'account', 'payment', 'transfer', 'billing', 'credit card', 'transaction', 'invoice'}
LOGIN_KWS = {'login', 'sign in', 'password', 'verify', 'update', 'confirm', 'authentication'}

def count_keywords(text, kw_set):
    text_lower = text.lower()
    count = 0
    for kw in kw_set:
        count += len(re.findall(r'\b' + re.escape(kw) + r'\b', text_lower))
    return count

def extract_sender_domain(sender):
    if pd.isna(sender) or not str(sender).strip():
        return None
    match = EMAIL_PATTERN.search(str(sender))
    if match:
        email = match.group()
        return email.split('@')[-1].lower()
    return None

def process_text(row):
    text = str(row['body']) if pd.notna(row['body']) else ""
    
    # Text normalization
    text = unicodedata.normalize('NFKC', text)
    
    # Feature extraction BEFORE replacements
    char_count = len(text)
    words = text.split()
    word_count = len(words)
    sentences = re.split(r'[.!?]+', text)
    sentence_count = len([s for s in sentences if s.strip()])
    avg_word_length = sum(len(w) for w in words) / word_count if word_count > 0 else 0
    
    uppercase_count = sum(1 for c in text if c.isupper())
    digit_count = sum(1 for c in text if c.isdigit())
    punct_count = sum(1 for c in text if c in string.punctuation)
    
    uppercase_ratio = uppercase_count / char_count if char_count > 0 else 0
    digit_ratio = digit_count / char_count if char_count > 0 else 0
    punctuation_ratio = punct_count / char_count if char_count > 0 else 0
    
    exclamation_count = text.count('!')
    question_count = text.count('?')
    
    # Counts
    url_count = len(URL_PATTERN.findall(text))
    email_count = len(EMAIL_PATTERN.findall(text))
    ip_count = len(IP_PATTERN.findall(text))
    html_tag_count = len(HTML_TAG_PATTERN.findall(text))
    
    attach_kw_count = count_keywords(text, ATTACHMENT_KWS)
    urg_kw_count = count_keywords(text, URGENCY_KWS)
    fin_kw_count = count_keywords(text, FINANCIAL_KWS)
    log_kw_count = count_keywords(text, LOGIN_KWS)
    
    # Replacements (order matters)
    cleaned_body = text
    cleaned_body = URL_PATTERN.sub('<URL>', cleaned_body)
    cleaned_body = EMAIL_PATTERN.sub('<EMAIL>', cleaned_body)
    cleaned_body = IP_PATTERN.sub('<IP>', cleaned_body)
    cleaned_body = HASH_PATTERN.sub('<HASH>', cleaned_body)
    cleaned_body = re.sub(r'\s+', ' ', cleaned_body).strip() # normalize whitespace
    
    return pd.Series({
        'character_count': char_count,
        'word_count': word_count,
        'sentence_count': sentence_count,
        'average_word_length': avg_word_length,
        'uppercase_ratio': uppercase_ratio,
        'digit_ratio': digit_ratio,
        'punctuation_ratio': punctuation_ratio,
        'exclamation_count': exclamation_count,
        'question_count': question_count,
        
        'url_count': url_count,
        'email_count': email_count,
        'ip_count': ip_count,
        'html_tag_count': html_tag_count,
        'attachment_keyword_count': attach_kw_count,
        'urgency_keyword_count': urg_kw_count,
        'financial_keyword_count': fin_kw_count,
        'login_keyword_count': log_kw_count,
        
        'cleaned_body': cleaned_body
    })

def main():
    print("Loading cleaned dataset...")
    df = pd.read_csv(INPUT_CSV)
    
    print("Extracting header features...")
    df['has_reply_to'] = df['reply_to'].notna().astype(int)
    df['has_return_path'] = df['return_path'].notna().astype(int)
    df['sender_domain'] = df['sender'].apply(extract_sender_domain)
    df['subject_length'] = df['subject'].apply(lambda x: len(str(x)) if pd.notna(x) else 0)
    
    print("Extracting body features and cleaning text... (this may take a minute)")
    features = df.apply(process_text, axis=1)
    
    # Combine
    df_engineered = pd.concat([df, features], axis=1)
    
    # Generate Report
    numeric_features = [
        'character_count', 'word_count', 'sentence_count', 'average_word_length',
        'uppercase_ratio', 'digit_ratio', 'punctuation_ratio',
        'exclamation_count', 'question_count',
        'url_count', 'email_count', 'ip_count', 'html_tag_count',
        'attachment_keyword_count', 'urgency_keyword_count',
        'financial_keyword_count', 'login_keyword_count',
        'subject_length'
    ]
    
    averages = df_engineered[numeric_features].mean().to_dict()
    
    pct_urls = (df_engineered['url_count'] > 0).mean() * 100
    pct_html = (df_engineered['html_tag_count'] > 0).mean() * 100
    pct_emails = (df_engineered['email_count'] > 0).mean() * 100
    
    top_sender_domains = df_engineered['sender_domain'].value_counts().head(20).to_dict()
    
    report = {
        "numeric_averages": {k: round(v, 4) for k, v in averages.items()},
        "percentages": {
            "contains_url": round(pct_urls, 2),
            "contains_html": round(pct_html, 2),
            "contains_email_address": round(pct_emails, 2)
        },
        "top_20_sender_domains": top_sender_domains,
        "total_rows": len(df_engineered)
    }
    
    print("Saving engineered dataset...")
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df_engineered.to_csv(OUTPUT_CSV, index=False)
    
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=4)
        
    print("Feature engineering complete.")
    print("Feature Report:")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
