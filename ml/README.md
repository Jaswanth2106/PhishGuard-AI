# Machine Learning Pipeline - PhishGuard AI

This directory manages the end-to-end Machine Learning pipeline for PhishGuard AI, from raw data collection to serialized model exports.

## Directory Structure
- `data/raw/`: Untouched original dataset files.
- `data/processed/`: Unified and cleaned datasets ready for training.
- `data/external/`: Threat intelligence lists.
- `reports/`: Automated evaluation metrics (ROC, Confusion Matrices, etc.).
- `scripts/`: Source code for the ML pipeline.

## Usage
For Phase 2.1 (Dataset Collection), the dataset manager reads from `config.json`.

```bash
python scripts/dataset_manager.py
```

### Dataset Validation Process
The dataset manager is extremely robust and performs the following checks before accepting a dataset:
1.  **License Check:** Ensures the dataset license exists in the `allowed_licenses` list.
2.  **HTTP Availability:** Checks if the URL returns a 200/301/302 status.
3.  **File Size Check:** Verifies the downloaded file is strictly `> 0 bytes`.
4.  **Archive Check:** Confirms the downloaded file ends with the expected extension (e.g., `.tar.gz`).
5.  **Checksum Check:** Computes a `SHA-256` hash of the downloaded file and compares it against the official `expected_checksum`.

If a dataset fails any step, it is marked as `FAILED` in the `dataset_manifest.json`, the corrupted file is deleted (so previous good states aren't overwritten), and the script safely continues to the next dataset.
