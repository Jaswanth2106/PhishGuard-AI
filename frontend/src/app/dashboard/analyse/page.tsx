"use client"

import { FormEvent, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  Info,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ServerCrash,
  ShieldAlert,
  WifiOff,
  Image as ImageIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { analyzeEmail, BackendApiError, type EmailPredictionResponse } from "@/lib/backend-api"
import { AiExplanationPanel, type AiExplanation } from "@/components/dashboard/AiExplanationPanel"

const MIN_BODY_LENGTH = 5

type AnalysisPayload = { subject: string; body: string }
type FieldErrors = { subject?: string; body?: string }
type ErrorKind = "timeout" | "network" | "backend" | "validation" | "unknown"
type AnalysisError = {
  title: string
  message: string
  kind: ErrorKind
  requestId?: string
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function riskLabel(result: EmailPredictionResponse) {
  return result.prediction === "phishing_or_spam" ? "Phishing/Spam" : "Legitimate"
}

function confidenceTone(result: EmailPredictionResponse) {
  if (result.confidence_score < 0.6) {
    return {
      label: "Low confidence",
      bar: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      panel: "border-amber-500/40 bg-amber-500/10",
    }
  }

  if (result.prediction === "phishing_or_spam") {
    return {
      label: "High risk",
      bar: "bg-destructive",
      text: "text-destructive",
      panel: "border-destructive/40 bg-destructive/10",
    }
  }

  return {
    label: "Likely safe",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    panel: "border-emerald-500/40 bg-emerald-500/10",
  }
}

function probabilityTone(value: number) {
  if (value >= 0.75) {
    return "text-destructive"
  }
  if (value >= 0.45) {
    return "text-amber-700 dark:text-amber-300"
  }
  return "text-emerald-700 dark:text-emerald-300"
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value))
}

function errorFromCaught(caught: unknown): AnalysisError {
  if (!(caught instanceof BackendApiError)) {
    return {
      kind: "unknown",
      title: "Analysis failed",
      message: "Something went wrong while analyzing this email. Please try again.",
    }
  }

  if (caught.code === "request_timeout") {
    return {
      kind: "timeout",
      title: "Request timed out",
      message: "The backend took too long to respond. Retry the request or check server load.",
      requestId: caught.requestId,
    }
  }

  if (caught.code === "network_error") {
    return {
      kind: "network",
      title: "Backend unavailable",
      message: "The frontend could not reach the FastAPI backend. Confirm the API server is running and reachable.",
      requestId: caught.requestId,
    }
  }

  if (caught.status === 422 || caught.code === "validation_error" || caught.code === "invalid_request") {
    return {
      kind: "validation",
      title: "Invalid request",
      message: caught.message,
      requestId: caught.requestId,
    }
  }

  if (caught.status === 503 || caught.code === "prediction_service_unavailable") {
    return {
      kind: "backend",
      title: "Prediction service unavailable",
      message: caught.message,
      requestId: caught.requestId,
    }
  }

  return {
    kind: "unknown",
    title: "Analysis failed",
    message: caught.message,
    requestId: caught.requestId,
  }
}

function errorIcon(kind: ErrorKind) {
  if (kind === "network") {
    return <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
  }
  if (kind === "timeout") {
    return <Clock3 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
  }
  if (kind === "backend") {
    return <ServerCrash className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
  }
  return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
}

function buildCopyText(result: EmailPredictionResponse) {
  const metadata = result.client_metadata
  return [
    `Prediction: ${riskLabel(result)}`,
    `Confidence Score: ${formatPercent(result.confidence_score)}`,
    `Probability-like Score: ${formatPercent(result.probability_like_score)}`,
    `Model Version: ${result.explanation.model_version}`,
    `Backend Version: ${metadata?.backend_version ?? "Not available"}`,
    `Request ID: ${metadata?.request_id ?? "Not available"}`,
    `Prediction Timestamp: ${metadata?.prediction_timestamp ?? "Not available"}`,
    `API Response Time: ${metadata?.response_time_ms ? `${metadata.response_time_ms} ms` : "Not available"}`,
    "Top Signals:",
    ...(result.explanation.top_signals.length ? result.explanation.top_signals.map((signal) => `- ${signal}`) : ["- None returned"]),
  ].join("\n")
}

export default function Page() {
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [result, setResult] = useState<EmailPredictionResponse | null>(null)
  const [error, setError] = useState<AnalysisError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastPayload, setLastPayload] = useState<AnalysisPayload | null>(null)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")

  const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null)
  const [isAiExplaining, setIsAiExplaining] = useState(false)

  const bodyCharacterCount = body.trim().length
  const canRetry = Boolean(lastPayload && !isLoading)
  const resultSignals = useMemo(() => result?.explanation.top_signals ?? [], [result])
  const tone = result ? confidenceTone(result) : null
  const confidencePercent = result ? Math.round(result.confidence_score * 100) : 0
  const probabilityPercent = result ? Math.round(result.probability_like_score * 100) : 0

  function validateForm() {
    const nextErrors: FieldErrors = {}

    if (!subject.trim()) {
      nextErrors.subject = "Enter the email subject before analyzing."
    }

    if (!body.trim()) {
      nextErrors.body = "Paste the email body before analyzing."
    } else if (body.trim().length < MIN_BODY_LENGTH) {
      nextErrors.body = `Email body must be at least ${MIN_BODY_LENGTH} characters.`
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function runAnalysis(payload: AnalysisPayload) {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setAiExplanation(null)
    setCopyState("idle")

    try {
      const prediction = await analyzeEmail(payload)
      setResult(prediction)
      setLastPayload(payload)
      
      // Fire history save async
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: payload.subject,
          body: payload.body,
          prediction: prediction.prediction,
          confidence: prediction.confidence_score,
        })
      }).catch(err => console.error("History save error", err))

      // Now fetch AI Explanation
      setIsAiExplaining(true)
      try {
        const explainRes = await fetch('/api/v1/analyze/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: payload.subject,
            body: payload.body,
            prediction: prediction.prediction,
            confidence_score: prediction.confidence_score,
            top_signals: prediction.explanation.top_signals,
          })
        })
        if (explainRes.ok) {
          const explanation = await explainRes.json()
          setAiExplanation(explanation)
        } else {
          const errData = await explainRes.json().catch(() => ({}));
          console.error("AI Explanation Server Error:", errData.error || "Unknown error");
          setAiExplanation({
             riskLevel: "Medium",
             reasons: [errData?.error || "Gemini AI is temporarily unavailable due to high demand. Please try again in a few minutes."],
             suspiciousLinks: [],
             socialEngineering: [],
             recommendedAction: "Try analyzing the email again later."
          })
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.error("AI Explanation error:", err?.message || "Failed to connect to explanation service");
        setAiExplanation({
           riskLevel: "Medium",
           reasons: ["Failed to connect to the Gemini AI explanation service."],
           suspiciousLinks: [],
           socialEngineering: [],
           recommendedAction: "Try analyzing the email again later."
        })
      } finally {
        setIsAiExplaining(false)
      }

    } catch (caught) {
      setError(errorFromCaught(caught))
      setLastPayload(payload)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isLoading) {
      return
    }

    if (!validateForm()) {
      setResult(null)
      setError(null)
      return
    }

    void runAnalysis({ subject: subject.trim(), body: body.trim() })
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOcrLoading, setIsOcrLoading] = useState(false)

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    await processImageFile(file)
  }

  async function processImageFile(file: File) {
    try {
      setIsOcrLoading(true)
      
      const formData = new FormData()
      formData.append("image", file)
      
      const response = await fetch("/api/v1/analyze/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errMessage = "Failed to extract text from image"
        try {
          const errData = await response.json()
          errMessage = errData.error || errMessage
        } catch {
          // ignore
        }
        
        setError({
          kind: "backend",
          title: "Image Extraction Unavailable",
          message: errMessage
        })
        return
      }

      const data = await response.json()
      const { subject: extractedSubject, body: extractedBody, extractedText } = data

      if (extractedSubject) {
        setSubject((prev) => prev ? `${prev} ${extractedSubject}` : extractedSubject)
      }

      const bodyContent = extractedBody || extractedText || ""

      if (bodyContent && bodyContent !== "No text found.") {
        setBody((prev) => (prev ? `${prev}\n\n[Extracted via Gemini Vision]\n${bodyContent}` : bodyContent))
      } else {
        setBody((prev) => (prev ? `${prev}\n\n[Extracted via Gemini Vision]\nNo text could be extracted.` : "No text could be extracted."))
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("OCR Error:", error.message || "Failed to process image")
      setError({
        kind: "unknown",
        title: "Image Upload Failed",
        message: error.message || "Failed to extract text from the image. Please try again or paste text manually."
      })
    } finally {
      setIsOcrLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    await processImageFile(file)
  }

  function handleRetry() {
    if (lastPayload) {
      void runAnalysis(lastPayload)
    }
  }

  async function handleCopyResult() {
    if (!result) {
      return
    }

    try {
      await navigator.clipboard.writeText(buildCopyText(result))
      setCopyState("copied")
      window.setTimeout(() => setCopyState("idle"), 1800)
    } catch {
      setCopyState("failed")
    }
  }

  function handleAnalyzeAnother() {
    setSubject("")
    setBody("")
    setResult(null)
    setError(null)
    setFieldErrors({})
    setLastPayload(null)
    setCopyState("idle")
    window.setTimeout(() => subjectInputRef.current?.focus(), 0)
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Email Analysis</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit an email subject and body to the production classifier.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="email-subject" className="text-sm font-medium">
                Subject
              </label>
              <input
                ref={subjectInputRef}
                id="email-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Example: URGENT account verification"
                aria-invalid={Boolean(fieldErrors.subject)}
                aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
              {fieldErrors.subject && (
                <p id="subject-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.subject}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="email-body" className="text-sm font-medium">
                  Body
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    {bodyCharacterCount} characters
                  </span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOcrLoading}
                  >
                    {isOcrLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
                    {isOcrLoading ? "Extracting..." : "Upload Image"}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              <div 
                className={`relative rounded-lg transition-all duration-200 ${isDragging ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragging && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary">
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <ImageIcon className="h-8 w-8 animate-bounce" />
                      <p className="font-medium">Drop image here to extract text</p>
                    </div>
                  </div>
                )}
                <textarea
                  id="email-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Paste the full email body here... Or drag & drop a screenshot to extract text."
                  rows={12}
                  aria-invalid={Boolean(fieldErrors.body)}
                  aria-describedby={fieldErrors.body ? "body-error" : undefined}
                  className="min-h-56 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                />
              </div>
              {fieldErrors.body && (
                <p id="body-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.body}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" size="lg" className="min-w-32" disabled={isLoading} aria-label="Analyze email with production classifier">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldAlert className="mr-2 h-4 w-4" aria-hidden="true" />}
                {isLoading ? "Analyzing" : "Analyze"}
              </Button>
              {canRetry && error && (
                <Button type="button" variant="outline" size="lg" onClick={handleRetry} aria-label="Retry failed analysis">
                  <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Retry
                </Button>
              )}
            </div>
          </form>
        </div>

        <aside className="glass-card p-5 sm:p-6" aria-live="polite" aria-busy={isLoading}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Result</h2>
              <p className="mt-1 text-sm text-muted-foreground">Backend response from the production `/predict` endpoint.</p>
            </div>
            {result && (
              <Button type="button" variant="outline" size="sm" onClick={handleAnalyzeAnother}>
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Analyze Another Email
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-6 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center" role="status" aria-label="Analyzing email">
                <span className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
                <span className="absolute h-12 w-12 animate-pulse rounded-full border border-primary/30" />
                <Loader2 className="relative h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-medium">Analyzing message signals...</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">The classifier is scoring content, URLs, urgency terms, and sender metadata.</p>
              <div className="mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive" role="alert">
              <div className="flex items-start gap-3">
                {errorIcon(error.kind)}
                <div className="min-w-0">
                  <p className="font-medium">{error.title}</p>
                  <p className="mt-1 text-sm opacity-90">{error.message}</p>
                  {error.requestId && <p className="mt-2 break-all text-xs opacity-80">Request ID: {error.requestId}</p>}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {canRetry && (
                      <Button type="button" variant="outline" size="sm" onClick={handleRetry} className="border-destructive/30">
                        <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                        Retry Analysis
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={handleAnalyzeAnother}>
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                      Analyze Another Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && !result && (
            <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
              <Info className="h-8 w-8" aria-hidden="true" />
              <p className="mt-3 text-sm">No analysis yet.</p>
            </div>
          )}

          {!isLoading && result && tone && (
            <div className="mt-6 space-y-5">
              <div className={`rounded-lg border p-4 ${tone.panel}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-background/70 p-2">
                      {result.prediction === "phishing_or_spam" ? <ShieldAlert className={`h-5 w-5 ${tone.text}`} aria-hidden="true" /> : <CheckCircle2 className={`h-5 w-5 ${tone.text}`} aria-hidden="true" />}
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Prediction</p>
                      <p className={`text-xl font-semibold ${tone.text}`}>{riskLabel(result)}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase text-muted-foreground">Confidence</p>
                    <p className={`text-2xl font-semibold ${tone.text}`}>{formatPercent(result.confidence_score)}</p>
                  </div>
                </div>

                <div className="mt-4" aria-label={`Confidence score ${formatPercent(result.confidence_score)}`}>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tone.label}</span>
                    <span>{confidencePercent}%</span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-background/70"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={confidencePercent}
                  >
                    <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${confidencePercent}%` }} />
                  </div>
                </div>
              </div>

              {isAiExplaining ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-6 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm font-medium">Gemini AI is analyzing the results...</p>
                </div>
              ) : (
                <AiExplanationPanel explanation={aiExplanation} />
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Confidence Score</p>
                  <p className={`mt-1 text-2xl font-semibold ${tone.text}`}>{formatPercent(result.confidence_score)}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Probability-like Score</p>
                  <p className={`mt-1 text-2xl font-semibold ${probabilityTone(result.probability_like_score)}`}>{formatPercent(result.probability_like_score)}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={probabilityPercent}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${probabilityPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Top Signals</p>
                  <span className="text-xs text-muted-foreground">{resultSignals.length} signal(s)</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {resultSignals.length ? resultSignals.map((signal) => (
                    <li key={signal} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <span>{signal}</span>
                    </li>
                  )) : <li>No top signals returned by the backend.</li>}
                </ul>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                <p className="font-medium">Explanation</p>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span>Decision score: {result.explanation.decision_score.toFixed(4)}</span>
                  <span>Threshold: {result.explanation.threshold.toFixed(1)}</span>
                  <span>URLs: {result.explanation.feature_summary.url_count}</span>
                  <span>Login keywords: {result.explanation.feature_summary.login_keyword_count}</span>
                  <span>Urgency keywords: {result.explanation.feature_summary.urgency_keyword_count}</span>
                  <span>Financial keywords: {result.explanation.feature_summary.financial_keyword_count}</span>
                </div>
              </div>

              <details className="rounded-lg border border-border/60 bg-background/60 p-4">
                <summary className="cursor-pointer font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/20">
                  Technical Details
                </summary>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Model Version</dt>
                    <dd className="mt-1 break-all">{result.explanation.model_version}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Backend Version</dt>
                    <dd className="mt-1 break-all">{result.client_metadata?.backend_version ?? "Not available"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Prediction Timestamp</dt>
                    <dd className="mt-1">{formatTimestamp(result.client_metadata?.prediction_timestamp)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">API Response Time</dt>
                    <dd className="mt-1">{result.client_metadata?.response_time_ms ? `${result.client_metadata.response_time_ms} ms` : "Not available"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase text-muted-foreground">Request ID</dt>
                    <dd className="mt-1 break-all">{result.client_metadata?.request_id ?? "Not available"}</dd>
                  </div>
                </dl>
              </details>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleCopyResult} aria-label="Copy prediction results to clipboard">
                  {copyState === "copied" ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="mr-2 h-4 w-4" aria-hidden="true" />}
                  {copyState === "copied" ? "Copied" : "Copy Results"}
                </Button>
                <Button type="button" variant="ghost" onClick={handleAnalyzeAnother}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Analyze Another Email
                </Button>
              </div>
              {copyState === "failed" && <p className="text-sm text-destructive" role="alert">Clipboard access failed. Select and copy the details manually.</p>}
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
