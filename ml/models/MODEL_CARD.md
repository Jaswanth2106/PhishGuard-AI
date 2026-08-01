# PhishGuard AI Linear SVM Email Threat Classifier

## Purpose

This model classifies processed email records as either legitimate (`0`) or phishing/spam (`1`) for the PhishGuard AI email threat intelligence workflow. It is intended to support risk triage and user-facing explanations, not to serve as the only control for blocking, quarantining, or reporting messages.

## Training Datasets

The model was trained on the Phase 2 composite email corpus built from:

- Enron Email Corpus (Sampled), version 1.0, Public Domain.
- SpamAssassin Public Corpus, version 20030228, Apache 2.0.
- Nazario Phishing Corpus, version 2015, Public Domain.
- Modern Phishing Emails (GitHub), version 2023.1, MIT.

After parsing and cleaning, the engineered dataset contained 5,406 rows: 3,393 legitimate emails and 2,013 phishing/spam emails. The model consumes cleaned email body text plus engineered metadata features such as URL count, HTML tag count, punctuation ratio, sender header indicators, and keyword counts.

## Performance

Evaluation used the Phase 2.5 strict holdout test set with 541 records.

| Metric | Value |
| --- | ---: |
| Accuracy | 0.9908 |
| Precision | 0.9900 |
| Recall | 0.9851 |
| F1 score | 0.9875 |
| ROC AUC | 0.9998 |
| PR AUC | 0.9997 |
| False positive rate | 0.0059 |
| False negative rate | 0.0149 |
| Average inference latency | 0.0068 ms/email |

The selected artifact is a scikit-learn `LinearSVC` model paired with a `ColumnTransformer` vectorizer. The vectorizer combines word TF-IDF, character TF-IDF, and 20 numeric metadata features.

## Limitations

- The model depends on the same preprocessing and feature engineering pipeline used during Phase 2. Inputs that skip or change that pipeline may produce unreliable predictions.
- It was trained on public corpora and may underrepresent private enterprise writing styles, non-English emails, very recent phishing campaigns, and organization-specific business workflows.
- `LinearSVC` provides margin scores rather than calibrated probabilities. Scores should not be presented as literal likelihoods.
- Text and metadata features may miss threats that are primarily image-based, attachment-based, or URL-reputation-based.
- Public datasets can contain historical artifacts that differ from modern email clients and current attacker behavior.

## Known Failure Cases

Phase 2.5 error analysis observed 2 false positives and 3 false negatives.

- False positives can occur when legitimate marketing, newsletter, or account-notification emails use urgent language or lack normal corporate signatures.
- False negatives can occur when phishing messages are short, casual, stripped of formatting, or use heavily disguised links.
- Example false-positive subjects included "welcome to aol instant messenger !" and "re : occidental battleground meter 98 - 1485 october 2000".
- Example false-negative subjects included "innovative big sized seencs", "message subject", and "smoke 9885".

## Ethical Considerations

This model should be used as a decision-support component with human review available for consequential actions. False positives can delay legitimate communication, while false negatives can expose users to harmful messages. Deployments should monitor performance drift, audit errors across user groups and languages, preserve user privacy, and avoid using the model output as the sole basis for punitive action against senders or recipients.

Production systems should log model version, artifact checksum, and decision score for traceability while minimizing stored email content. Users should receive clear explanations that the classifier can be wrong and should remain able to report mistakes.

## Deployment Artifacts

- Model: `ml/models/model.pkl`
- Vectorizer: `ml/models/vectorizer.pkl`
- Metadata: `ml/models/model_metadata.json`
- Deployment manifest: `ml/models/deployment_manifest.json`

SHA-256 checksums are recorded in `model_metadata.json`.
