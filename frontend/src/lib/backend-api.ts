export type PredictionLabel = "legitimate" | "phishing_or_spam"

export type EmailPredictionRequest = {
  subject: string
  body: string
  metadata?: Record<string, unknown>
}

export type EmailFeatureSummary = {
  has_reply_to: number
  has_return_path: number
  subject_length: number
  character_count: number
  word_count: number
  sentence_count: number
  average_word_length: number
  uppercase_ratio: number
  digit_ratio: number
  punctuation_ratio: number
  exclamation_count: number
  question_count: number
  url_count: number
  email_count: number
  ip_count: number
  html_tag_count: number
  attachment_keyword_count: number
  urgency_keyword_count: number
  financial_keyword_count: number
  login_keyword_count: number
  cleaned_body: string
}

export type BackendRequestMetadata = {
  request_id?: string
  response_time_ms: number
  prediction_timestamp: string
  backend_version?: string
}

export type EmailPredictionResponse = {
  prediction: PredictionLabel
  label: number
  confidence_score: number
  probability_like_score: number
  explanation: {
    model_version: string
    decision_score: number
    threshold: number
    top_signals: string[]
    feature_summary: EmailFeatureSummary
  }
  client_metadata?: BackendRequestMetadata
}

export type BackendVersionResponse = {
  api_version: string
  model_version: string
  environment: string
}

type BackendErrorResponse = {
  error?: {
    code?: string
    message?: string
    request_id?: string
    details?: unknown
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  timeoutMs?: number
}

type BackendResult<T> = {
  data: T
  metadata: BackendRequestMetadata
}

export class BackendApiError extends Error {
  status?: number
  code?: string
  requestId?: string

  constructor(message: string, options: { status?: number; code?: string; requestId?: string } = {}) {
    super(message)
    this.name = "BackendApiError"
    this.status = options.status
    this.code = options.code
    this.requestId = options.requestId
  }
}

const DEFAULT_TIMEOUT_MS = 10000

export function backendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")
}

async function requestBackendWithMetadata<T>(path: string, options: RequestOptions = {}): Promise<BackendResult<T>> {
  const controller = new AbortController()
  const startedAt = performance.now()
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const resolvedBaseUrl = backendBaseUrl();
    const finalUrl = `${resolvedBaseUrl}${path}`;
    console.log("[RUNTIME TRACE] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
    console.log("[RUNTIME TRACE] Resolved Base URL:", resolvedBaseUrl);
    console.log("[RUNTIME TRACE] Final Fetch URL:", finalUrl);

    const response = await fetch(finalUrl, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    })

    const responseTimeMs = Math.round(performance.now() - startedAt)
    const data = (await response.json().catch(() => null)) as T | BackendErrorResponse | null
    const responseRequestId = response.headers.get("x-request-id") ?? undefined

    if (!response.ok) {
      const backendError = data as BackendErrorResponse | null
      throw new BackendApiError(
        backendError?.error?.message || "The API request failed.",
        {
          status: response.status,
          code: backendError?.error?.code,
          requestId: backendError?.error?.request_id ?? responseRequestId,
        }
      )
    }

    return {
      data: data as T,
      metadata: {
        request_id: responseRequestId,
        response_time_ms: responseTimeMs,
        prediction_timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BackendApiError("The backend took too long to respond. Please try again.", {
        code: "request_timeout",
      })
    }

    if (error instanceof TypeError) {
      throw new BackendApiError("Unable to reach the backend API. Check that FastAPI is running.", {
        code: "network_error",
      })
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function requestBackend<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await requestBackendWithMetadata<T>(path, options)
  return result.data
}

export async function getBackendVersion(): Promise<BackendVersionResponse> {
  return requestBackend<BackendVersionResponse>("/version")
}

export async function analyzeEmail(
  payload: EmailPredictionRequest,
  options: { timeoutMs?: number } = {}
): Promise<EmailPredictionResponse> {
  const predictionResult = await requestBackendWithMetadata<EmailPredictionResponse>("/predict", {
    method: "POST",
    body: payload,
    timeoutMs: options.timeoutMs,
  })
  const version = await getBackendVersion().catch(() => null)

  return {
    ...predictionResult.data,
    client_metadata: {
      ...predictionResult.metadata,
      backend_version: version?.api_version,
    },
  }
}
