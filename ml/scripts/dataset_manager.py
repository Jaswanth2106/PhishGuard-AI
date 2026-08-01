import os
import json
import urllib.request
import hashlib
import argparse
import tarfile
import zipfile
import shutil
from urllib.error import URLError, HTTPError
from datetime import datetime
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / "config.json"
MANIFEST_PATH = Path(__file__).parent.parent / "dataset_manifest.json"
REPORT_PATH = Path(__file__).parent.parent / "reports" / "download_report.json"
BASE_DIR = Path(__file__).parent.parent

def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

def compute_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def extract_archive(file_path, extract_path, archive_type):
    try:
        if archive_type in ['.tar.gz', '.tar.bz2']:
            with tarfile.open(file_path, 'r:*') as tar:
                tar.extractall(path=extract_path)
            return "SUCCESS", None
        elif archive_type == '.zip':
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            return "SUCCESS", None
        elif archive_type in ['.mbox', '.csv']:
            # No extraction needed for raw text files
            return "NOT_REQUIRED", None
        else:
            return "FAILED", f"Unsupported archive type: {archive_type}"
    except Exception as e:
        return "FAILED", str(e)

def main(dry_run=False):
    print("--- PhishGuard AI Real Dataset Manager (Phase 2.1) ---")
    
    config = load_config()
    datasets = config.get("datasets", {})
    allowed_licenses = config.get("allowed_licenses", [])
    
    manifest = []
    download_report = []
    
    for key, data in datasets.items():
        print(f"\nProcessing: {data['name']}")
        
        status = {
            "dataset_name": data['name'],
            "version": data['version'],
            "license": data['license'],
            "download_date": datetime.utcnow().isoformat() + "Z",
            "source_url": data['url'],
            "local_path": str((BASE_DIR / data['local_path']).resolve()),
            "expected_file_name": data.get('expected_file_name'),
            "archive_type": data.get('archive_type'),
            
            "download_status": "PENDING",
            "validation_status": "PENDING",
            "file_size_bytes": 0,
            "checksum_status": "N/A",
            "extraction_status": "PENDING",
            "error_message": None
        }
        
        report_entry = {
            "dataset": data['name'],
            "source_url": data['url'],
            "license": data['license'],
            "downloaded_size_bytes": 0,
            "extraction_status": "PENDING",
            "failures": []
        }
        
        if data['license'] not in allowed_licenses:
            print(f"    [x] REJECTED: License '{data['license']}' is not allowed.")
            status["validation_status"] = "FAILED_LICENSE"
            report_entry["failures"].append(f"Invalid license: {data['license']}")
            manifest.append(status)
            download_report.append(report_entry)
            continue
            
        local_path = BASE_DIR / data['local_path']
        local_path.mkdir(parents=True, exist_ok=True)
        target_file = local_path / data['expected_file_name']
        
        # Download
        print(f"    [*] Downloading from: {data['url']}")
        try:
            req = urllib.request.Request(data['url'], headers={'User-Agent': 'Mozilla/5.0'})
            import ssl
            context = ssl._create_unverified_context()
            if dry_run:
                print("    [!] DRY RUN: Skipping actual download.")
                status["download_status"] = "DRY_RUN"
            else:
                with urllib.request.urlopen(req, timeout=30, context=context) as response:
                    status_code = response.getcode()
                    if status_code not in [200, 301, 302]:
                        raise HTTPError(data['url'], status_code, "Bad Status", response.info(), None)
                    
                    with open(target_file, 'wb') as out_file:
                        out_file.write(response.read())
                
                file_size = os.path.getsize(target_file)
                status["download_status"] = "SUCCESS"
                status["file_size_bytes"] = file_size
                report_entry["downloaded_size_bytes"] = file_size
                print(f"    [v] Downloaded successfully ({file_size} bytes).")
                
        except Exception as e:
            print(f"    [x] Download FAILED: {e}")
            status["download_status"] = "FAILED"
            status["validation_status"] = "FAILED_DOWNLOAD"
            status["error_message"] = str(e)
            report_entry["failures"].append(f"Download failed: {e}")
            manifest.append(status)
            download_report.append(report_entry)
            continue
            
        if dry_run:
            manifest.append(status)
            download_report.append(report_entry)
            continue

        # Validation
        if status["file_size_bytes"] <= 0:
            msg = "File size is 0 bytes."
            print(f"    [x] Validation FAILED: {msg}")
            status["validation_status"] = "FAILED_EMPTY"
            report_entry["failures"].append(msg)
            manifest.append(status)
            download_report.append(report_entry)
            continue
            
        if not target_file.name.endswith(data['archive_type']):
            msg = f"File does not match expected archive type {data['archive_type']}"
            print(f"    [x] Validation FAILED: {msg}")
            status["validation_status"] = "FAILED_ARCHIVE_TYPE"
            report_entry["failures"].append(msg)
            manifest.append(status)
            download_report.append(report_entry)
            continue
            
        # Checksum
        expected_checksum = data.get('expected_checksum')
        if expected_checksum:
            print(f"    [*] Validating Checksum...")
            actual_checksum = compute_sha256(target_file)
            if actual_checksum != expected_checksum:
                msg = "Checksum mismatch!"
                print(f"    [x] {msg}")
                status["validation_status"] = "FAILED_CHECKSUM"
                status["checksum_status"] = "FAILED"
                report_entry["failures"].append(msg)
                target_file.unlink()
                manifest.append(status)
                download_report.append(report_entry)
                continue
            else:
                status["checksum_status"] = "VALIDATED"
                print("    [v] Checksum MATCH.")
        
        status["validation_status"] = "VALIDATED"
        
        # Extraction
        print(f"    [*] Extracting archive...")
        ext_status, ext_error = extract_archive(target_file, local_path, data['archive_type'])
        status["extraction_status"] = ext_status
        report_entry["extraction_status"] = ext_status
        
        if ext_status == "FAILED":
            print(f"    [x] Extraction FAILED: {ext_error}")
            report_entry["failures"].append(f"Extraction failed: {ext_error}")
        elif ext_status == "NOT_REQUIRED":
            print("    [-] Extraction not required for this file type.")
        else:
            print("    [v] Extraction SUCCESS.")
            
        manifest.append(status)
        download_report.append(report_entry)
        
    # Write outputs
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=4)
        
    os.makedirs(REPORT_PATH.parent, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(download_report, f, indent=4)
        
    print(f"\n--- Process Complete ---")
    print(f"Dataset Manifest written to: {MANIFEST_PATH}")
    print(f"Download Report written to: {REPORT_PATH}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Skip actual downloads")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
