import csv
import random
from pathlib import Path

OUTPUT_FILE = Path(__file__).parent.parent / "data" / "processed" / "engineered_dataset.csv"

def generate_mock_data():
    headers = ["id", "sender", "subject", "body", "label", "date", "reply-to", "return-path", "message-id", 
               "char_count", "word_count", "digit_count", "upper_ratio", "exclamation_count", "html_count", 
               "url_count", "email_count", "cleaned_body"]
    
    rows = []
    
    # Generate 150 rows (75 Ham, 75 Spam) to ensure train/val/test splits don't crash
    for i in range(150):
        is_spam = i % 2 == 0
        if is_spam:
            body = "click here to win free money urgent prize <URL> <EMAIL>"
            subject = "URGENT WINNER"
            label = 1
        else:
            body = "hello please review the attached meeting notes for tomorrow"
            subject = "Meeting notes"
            label = 0
            
        row = [
            f"uuid-{i}", "test@test.com", subject, body, label, "", "", "", "",
            len(body), len(body.split()), 0, 0.1, 1 if is_spam else 0, 0, 1 if is_spam else 0, 1 if is_spam else 0,
            body
        ]
        rows.append(row)
        
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
        
    print(f"Generated 150 synthetic rows for testing at {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_mock_data()
