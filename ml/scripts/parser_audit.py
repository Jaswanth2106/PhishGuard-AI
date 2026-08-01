import os
import json
import mailbox
import email
from email.policy import default
import traceback
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"

def get_email_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(part.get_content_charset('utf-8') or 'utf-8', errors='ignore')
        # fallback to html
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/html" and "attachment" not in content_disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(part.get_content_charset('utf-8') or 'utf-8', errors='ignore')
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode(msg.get_content_charset('utf-8') or 'utf-8', errors='ignore')
    return ""

def extract_msg_fields(msg):
    subject = msg.get("Subject", "")
    sender = msg.get("From", "")
    date = msg.get("Date", "")
    msg_id = msg.get("Message-ID", "")
    reply_to = msg.get("Reply-To", "")
    return_path = msg.get("Return-Path", "")
    body = get_email_body(msg)
    
    return {
        "sender": str(sender).strip() if sender else None,
        "subject": str(subject).strip() if subject else None,
        "body": str(body).strip() if body else None
    }

def audit():
    failures = []

    # 1. Enron
    enron_base = RAW_DATA_DIR / "enron" / "enron1"
    if enron_base.exists():
        for label_dir in ["ham", "spam"]:
            d = enron_base / label_dir
            if not d.exists(): continue
            for filename in os.listdir(d):
                fp = d / filename
                if fp.is_file():
                    try:
                        with open(fp, "r", encoding="latin-1") as f:
                            lines = f.readlines()
                        if not lines:
                            failures.append({"filename": str(fp), "dataset": "enron", "error": "Empty file", "exception": ""})
                            continue
                        subject = ""
                        body = ""
                        if lines[0].startswith("Subject:"):
                            pass
                    except Exception as e:
                        failures.append({"filename": str(fp), "dataset": "enron", "error": "Exception during read", "exception": traceback.format_exc()})

    # 2. SpamAssassin
    sa_base = RAW_DATA_DIR / "spamassassin" / "spam"
    if sa_base.exists():
        for filename in os.listdir(sa_base):
            fp = sa_base / filename
            if fp.is_file() and filename != "cmds":
                try:
                    with open(fp, "rb") as f:
                        msg = email.message_from_binary_file(f, policy=default)
                    res = extract_msg_fields(msg)
                    if not res:
                        failures.append({"filename": str(fp), "dataset": "spamassassin", "error": "Empty result from extract_msg_fields", "exception": ""})
                except Exception as e:
                    failures.append({"filename": str(fp), "dataset": "spamassassin", "error": "Exception during parse", "exception": traceback.format_exc()})

    # 3. Nazario
    naz_mbox = RAW_DATA_DIR / "nazario" / "phishing0.mbox"
    if naz_mbox.exists():
        mbox = mailbox.mbox(naz_mbox)
        for idx, msg in enumerate(mbox):
            try:
                res = extract_msg_fields(msg)
                if not res:
                    failures.append({"filename": f"nazario_msg_{idx}", "dataset": "nazario", "error": "Empty result from extract_msg_fields", "exception": ""})
            except Exception as e:
                failures.append({"filename": f"nazario_msg_{idx}", "dataset": "nazario", "error": "Exception during parse", "exception": traceback.format_exc()})

    print(json.dumps(failures, indent=4))

if __name__ == "__main__":
    audit()
