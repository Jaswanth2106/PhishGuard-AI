import pandas as pd
import hashlib
import json
import re
import time
import random
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
INPUT_CSV = BASE_DIR / "data" / "processed" / "merged_raw.csv"
OUTPUT_CSV = BASE_DIR / "data" / "processed" / "cleaned_dataset.csv"
REPORT_DIR = BASE_DIR / "reports"
REPORT_PATH = REPORT_DIR / "cleaning_report.json"

def exact_hash(subject, body):
    s = str(subject) if pd.notna(subject) else ""
    b = str(body) if pd.notna(body) else ""
    return hashlib.sha256((s + b).encode('utf-8')).hexdigest()

def get_shingles(text):
    text = str(text) if pd.notna(text) else ""
    tokens = text.lower().split()
    if not tokens:
        return set()
    # 3-shingles
    shingles = set()
    for i in range(len(tokens) - 2):
        shingles.add(" ".join(tokens[i:i+3]))
    return shingles

def jaccard(s1, s2):
    if not s1 and not s2: return 1.0
    if not s1 or not s2: return 0.0
    return len(s1.intersection(s2)) / len(s1.union(s2))

# MinHash + LSH parameters
NUM_PERM = 100
BANDS = 20
ROWS = 5

# Generate permutation coefficients once
random.seed(42)
MAX_HASH = (1 << 32) - 1
M_PRIME = 4294967311 # Prime > MAX_HASH
a_coeffs = [random.randint(1, M_PRIME - 1) for _ in range(NUM_PERM)]
b_coeffs = [random.randint(0, M_PRIME - 1) for _ in range(NUM_PERM)]

def minhash_signature(shingles):
    sig = [float('inf')] * NUM_PERM
    for shingle in shingles:
        # hash shingle to integer
        x = int(hashlib.md5(shingle.encode('utf-8')).hexdigest()[:8], 16)
        for i in range(NUM_PERM):
            h = (a_coeffs[i] * x + b_coeffs[i]) % M_PRIME
            if h < sig[i]:
                sig[i] = h
    return sig

def lsh_candidates(signatures):
    # Returns a set of candidate pairs (i, j) where i < j
    candidates = set()
    for b in range(BANDS):
        buckets = defaultdict(list)
        start = b * ROWS
        end = start + ROWS
        for idx, sig in enumerate(signatures):
            if not sig or sig[0] == float('inf'):
                continue
            # Hash the band to a bucket key
            band = tuple(sig[start:end])
            bucket_key = hash(band)
            buckets[bucket_key].append(idx)
        
        for bucket in buckets.values():
            if len(bucket) > 1:
                # Add all pairs in this bucket
                for i in range(len(bucket)):
                    for j in range(i+1, len(bucket)):
                        candidates.add( (bucket[i], bucket[j]) )
    return candidates

def main():
    start_time = time.time()
    print("Loading raw dataset...")
    df = pd.read_csv(INPUT_CSV)
    
    total_input = len(df)
    class_dist_before = {str(k): int(v) for k, v in df['label'].value_counts().to_dict().items()}
    
    # A. Remove empty bodies, whitespace-only, shorter than 5 visible chars
    def is_valid_body(text):
        if pd.isna(text): return False
        s = str(text).strip()
        visible_chars = len(re.sub(r'\s+', '', s))
        return visible_chars >= 5

    empty_mask = df['body'].isna() | (df['body'].astype(str).str.strip() == "")
    rows_removed_empty = empty_mask.sum()
    
    mask_valid = df['body'].apply(is_valid_body)
    df_valid = df[mask_valid].copy()
    rows_removed_short = total_input - len(df_valid) - rows_removed_empty

    # B. Normalize line endings
    df_valid['body'] = df_valid['body'].apply(lambda x: str(x).replace('\r\n', '\n').replace('\r', '\n'))
    
    # D. Exact duplicate removal
    print("Removing exact duplicates...")
    df_valid['exact_hash'] = df_valid.apply(lambda row: exact_hash(row['subject'], row['body']), axis=1)
    len_before_exact = len(df_valid)
    df_valid = df_valid.drop_duplicates(subset=['exact_hash']).copy()
    exact_duplicates_removed = len_before_exact - len(df_valid)
    
    # E. Near-duplicate removal via MinHash + LSH
    print("Generating MinHash signatures...")
    shingles_list = df_valid['body'].apply(get_shingles).tolist()
    signatures = [minhash_signature(s) if s else [] for s in shingles_list]
    
    print("Finding candidate pairs via LSH...")
    candidate_pairs = lsh_candidates(signatures)
    
    to_drop = set()
    n = len(shingles_list)
    lengths = [len(s) for s in shingles_list]
    
    print(f"Examining {len(candidate_pairs)} candidate pairs...")
    for i, j in candidate_pairs:
        if i in to_drop or j in to_drop: 
            continue
        len1 = lengths[i]
        len2 = lengths[j]
        # Jaccard upper bound: min(len1, len2) / max(len1, len2)
        if len1 == 0 or len2 == 0:
            continue
        if min(len1, len2) / max(len1, len2) < 0.95:
            continue
            
        sim = jaccard(shingles_list[i], shingles_list[j])
        if sim >= 0.95:
            # Drop the one with higher index to retain the first occurrence
            to_drop.add(max(i, j))
                
    near_duplicates_removed = len(to_drop)
    indices_to_keep = [i for i in range(n) if i not in to_drop]
    df_final = df_valid.iloc[indices_to_keep].copy()
    
    df_final = df_final.drop(columns=['exact_hash'])
    
    final_size = len(df_final)
    class_dist_after = {str(k): int(v) for k, v in df_final['label'].value_counts().to_dict().items()}
    
    elapsed_time = time.time() - start_time
    
    report = {
        "total_input_rows": int(total_input),
        "rows_removed_empty": int(rows_removed_empty),
        "rows_removed_short": int(rows_removed_short),
        "exact_duplicates_removed": int(exact_duplicates_removed),
        "minhash_signatures_generated": len(signatures),
        "candidate_pairs_examined": len(candidate_pairs),
        "near_duplicates_removed": int(near_duplicates_removed),
        "runtime_seconds": round(elapsed_time, 2),
        "final_dataset_size": int(final_size),
        "class_distribution_before_cleaning": class_dist_before,
        "class_distribution_after_cleaning": class_dist_after
    }
    
    print("Saving cleaned dataset...")
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df_final.to_csv(OUTPUT_CSV, index=False)
    
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=4)
        
    print("Cleaning complete.")
    print("Cleaning Report:")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
