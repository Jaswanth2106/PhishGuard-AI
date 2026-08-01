import os
import json
import mailbox
import email
from email.policy import default
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
REPORT_DIR = BASE_DIR / "reports"
REPORT_PATH = REPORT_DIR / "parsing_report.json"
OUTPUT_CSV = PROCESSED_DIR / "merged_raw.csv"

def decode_payload(payload, declared_charset, filename, dataset, fallback_log):
    if not payload:
        return ""
    
    charsets_to_try = [
        (declared_charset, "strict"),
        ("utf-8", "replace"),
        ("latin-1", "replace"),
        ("utf-8", "ignore")
    ]
    
    for idx, (charset, errors) in enumerate(charsets_to_try):
        if not charset:
            continue
        try:
            decoded = payload.decode(charset, errors=errors)
            if idx > 0:
                fallback_log.append({
                    "filename": str(filename),
                    "dataset": dataset,
                    "declared_charset": declared_charset,
                    "fallback_charset_used": f"{charset} ({errors})"
                })
            return decoded
        except (LookupError, UnicodeDecodeError, Exception):
            continue
            
    return ""

def get_email_body(msg, filename, dataset, fallback_log):
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                charset = part.get_content_charset()
                return decode_payload(payload, charset, filename, dataset, fallback_log)
        # fallback to html
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/html" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                charset = part.get_content_charset()
                return decode_payload(payload, charset, filename, dataset, fallback_log)
    else:
        payload = msg.get_payload(decode=True)
        charset = msg.get_content_charset()
        return decode_payload(payload, charset, filename, dataset, fallback_log)
    return ""

def parse_rfc822(file_path, dataset, fallback_log):
    try:
        with open(file_path, "rb") as f:
            msg = email.message_from_binary_file(f, policy=default)
        return extract_msg_fields(msg, file_path.name, dataset, fallback_log)
    except Exception as e:
        return None

def extract_msg_fields(msg, filename, dataset, fallback_log):
    subject = msg.get("Subject", "")
    sender = msg.get("From", "")
    date = msg.get("Date", "")
    msg_id = msg.get("Message-ID", "")
    reply_to = msg.get("Reply-To", "")
    return_path = msg.get("Return-Path", "")
    body = get_email_body(msg, filename, dataset, fallback_log)
    
    return {
        "sender": str(sender).strip() if sender else None,
        "subject": str(subject).strip() if subject else None,
        "body": str(body).strip() if body else None,
        "date": str(date).strip() if date else None,
        "message_id": str(msg_id).strip() if msg_id else None,
        "reply_to": str(reply_to).strip() if reply_to else None,
        "return_path": str(return_path).strip() if return_path else None
    }

def parse_enron_file(file_path, dataset, fallback_log):
    try:
        with open(file_path, "r", encoding="latin-1") as f:
            lines = f.readlines()
        if not lines:
            return None
        subject = ""
        body = ""
        if lines[0].startswith("Subject:"):
            subject = lines[0].replace("Subject:", "").strip()
            body = "".join(lines[1:]).strip()
        else:
            body = "".join(lines).strip()
            
        return {
            "sender": None,
            "subject": subject if subject else None,
            "body": body if body else None,
            "date": None,
            "message_id": None,
            "reply_to": None,
            "return_path": None
        }
    except Exception:
        return None

def process_datasets():
    records = []
    failed = 0
    fallback_log = []
    
    # 1. Enron
    print("Parsing Enron...")
    enron_base = RAW_DATA_DIR / "enron" / "enron1"
    if enron_base.exists():
        for label_dir, label_val in [("ham", 0), ("spam", 1)]:
            d = enron_base / label_dir
            if not d.exists(): continue
            for filename in os.listdir(d):
                fp = d / filename
                if fp.is_file():
                    res = parse_enron_file(fp, "enron", fallback_log)
                    if res:
                        res["label"] = label_val
                        res["source"] = "enron"
                        records.append(res)
                    else:
                        failed += 1

    # 2. SpamAssassin
    print("Parsing SpamAssassin...")
    sa_base = RAW_DATA_DIR / "spamassassin" / "spam"
    if sa_base.exists():
        for filename in os.listdir(sa_base):
            fp = sa_base / filename
            if fp.is_file() and filename != "cmds":
                res = parse_rfc822(fp, "spamassassin", fallback_log)
                if res:
                    res["label"] = 1
                    res["source"] = "spamassassin"
                    records.append(res)
                else:
                    failed += 1

    # 3. Nazario
    print("Parsing Nazario...")
    naz_mbox = RAW_DATA_DIR / "nazario" / "phishing0.mbox"
    if naz_mbox.exists():
        mbox = mailbox.mbox(naz_mbox)
        for idx, msg in enumerate(mbox):
            try:
                res = extract_msg_fields(msg, f"nazario_msg_{idx}", "nazario", fallback_log)
                if res:
                    res["label"] = 1
                    res["source"] = "nazario"
                    records.append(res)
                else:
                    failed += 1
            except Exception:
                failed += 1

    df = pd.DataFrame(records)
    
    # Calculate stats
    total_parsed = len(df)
    
    report = {
        "total_parsed": int(total_parsed),
        "recovered_emails": len(fallback_log),
        "failed_parses": int(failed),
        "fallback_decoding_count": len(fallback_log),
        "remaining_unrecoverable_emails": int(failed),
        "fallback_events": fallback_log
    }
    
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Saving to CSV...")
    df.to_csv(OUTPUT_CSV, index=False)
    
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=4)
        
    print(f"Parsing complete. Merged CSV saved to {OUTPUT_CSV}")
    print("Parsing Report:")
    summary_report = report.copy()
    del summary_report['fallback_events']
    print(json.dumps(summary_report, indent=2))

if __name__ == "__main__":
    process_datasets()
