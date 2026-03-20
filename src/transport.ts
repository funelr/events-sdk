import type { EventPayload } from "./schemas.js"

/** Options for {@link sendBatch}. */
export interface BatchSendOptions {
  /** Base endpoint URL, e.g. `"https://ingest.funelr.io/v1/collect"`. */
  endpoint: string
  /** Events to deliver. */
  events: EventPayload[]
  /** API key sent as the `X-Api-Key` request header. */
  apiKey?: string
  /** Maximum retry attempts on network errors or 5xx responses. Defaults to `3`. */
  maxRetries?: number
}

/** Options for {@link sendLegacy}. */
export interface LegacySendOptions {
  endpoint: string
  payload: EventPayload
}

function backoff(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 30_000)))
}

async function sendWithRetry(
  endpoint: string,
  body: string,
  headers: Record<string, string>,
  maxRetries: number,
  attempt = 0,
): Promise<void> {
  try {
    const res = await fetch(endpoint, { method: "POST", headers, body, keepalive: true })
    if (!res.ok && res.status >= 500 && attempt < maxRetries) {
      await backoff(attempt)
      return sendWithRetry(endpoint, body, headers, maxRetries, attempt + 1)
    }
  } catch {
    if (attempt < maxRetries) {
      await backoff(attempt)
      return sendWithRetry(endpoint, body, headers, maxRetries, attempt + 1)
    }
  }
}

/**
 * Sends a batch of events to `{endpoint}/batch` via `POST`.
 *
 * For single-event flushes the function attempts `navigator.sendBeacon` first
 * to guarantee delivery during page unload. Multi-event batches fall back to
 * `fetch` with exponential-backoff retries on network errors and 5xx responses.
 *
 * Delivery failures are intentionally silent — event tracking is best-effort.
 */
export function sendBatch({ endpoint, events, apiKey, maxRetries = 3 }: BatchSendOptions): void {
  if (events.length === 0) return

  const body = JSON.stringify({ events })
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers["X-Api-Key"] = apiKey

  const batchEndpoint = `${endpoint}/batch`

  if (events.length === 1 && typeof navigator?.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(batchEndpoint, blob)) return
  }

  sendWithRetry(batchEndpoint, body, headers, maxRetries).catch(() => {})
}

/**
 * Legacy single-event transport compatible with the v0.2.x ingest API.
 *
 * Prefers `navigator.sendBeacon` for reliability during page unload; falls
 * back to `fetch` when sendBeacon is unavailable or returns `false`.
 *
 * @deprecated Use {@link sendBatch} with an `apiKey` for new integrations.
 */
export function sendLegacy({ endpoint, payload }: LegacySendOptions): void {
  const body = JSON.stringify(payload)

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(endpoint, blob)) return
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {})
}
