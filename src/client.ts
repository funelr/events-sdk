import { SDK_VERSION } from "./constants.js"
import type { EventPayload } from "./schemas.js"
import {
  clearAnonymousId,
  clearSessionId,
  getOrCreateAnonymousId,
  getOrCreateSessionId,
} from "./session.js"
import { sendBatch } from "./transport.js"
import { isAllowedEventName } from "./validation.js"

/** Configuration options for {@link createFunnelClient}. */
export interface FunnelClientConfig {
  /**
   * Base URL of the ingest endpoint.
   *
   * @example "https://ingest.funelr.io/v1/collect"
   */
  endpoint: string

  /**
   * API key for the project. Events are sent as a batch to `{endpoint}/batch`
   * with an `X-Api-Key` header.
   */
  apiKey?: string

  /**
   * Optional allowlist of accepted event names. Events whose name is not
   * present in this list are silently dropped. When omitted, all names are
   * accepted.
   */
  allowedEventNames?: readonly string[]

  /**
   * Initial consent state. No data is collected until consent is `true`.
   *
   * @defaultValue `false`
   */
  consent?: boolean

  /**
   * Custom `sessionStorage` key for the session identifier.
   *
   * @defaultValue `"funnel_session_id"`
   */
  sessionStorageKey?: string

  /**
   * Custom `localStorage` key for the anonymous visitor identifier.
   *
   * @defaultValue `"funnel_anonymous_id"`
   */
  anonymousIdStorageKey?: string

  /**
   * Number of queued events that triggers an automatic flush.
   *
   * @defaultValue `20`
   */
  batchSize?: number

  /**
   * Interval in milliseconds between automatic flushes while events are queued.
   *
   * @defaultValue `5000`
   */
  flushInterval?: number

  /**
   * Maximum retry attempts on network errors or 5xx responses.
   *
   * @defaultValue `3`
   */
  maxRetries?: number
}

/** Public interface returned by {@link createFunnelClient}. */
export interface FunnelClient {
  /**
   * Records an event in the internal queue.
   *
   * The event is flushed automatically when the batch threshold or flush
   * interval is reached, or when `flush()` is called explicitly. This method
   * is a no-op when consent has not been granted or when `eventName` is not
   * in the configured `allowedEventNames` list.
   */
  track(eventName: string, properties?: Record<string, unknown>): void

  /**
   * Returns the current session ID, or `undefined` if consent has not been
   * granted or `sessionStorage` is unavailable.
   */
  getSessionId(): string | undefined

  /**
   * Returns the persistent anonymous visitor ID, or `undefined` if consent
   * has not been granted or `localStorage` is unavailable.
   */
  getAnonymousId(): string | undefined

  /**
   * Updates the consent state at runtime.
   *
   * When consent is revoked (`false`), all queued events are discarded, the
   * flush timer is stopped, and all locally stored identifiers are removed.
   */
  setConsent(given: boolean): void

  /** Immediately sends all queued events to the ingest endpoint. */
  flush(): void

  /**
   * Flushes remaining events, stops the flush timer, and removes the
   * page-lifecycle event listeners registered by this client instance.
   */
  destroy(): void
}

/**
 * Creates a new {@link FunnelClient} instance.
 *
 * The client batches events in memory and flushes them to the configured
 * ingest endpoint when the batch size threshold is reached, on a periodic
 * interval, or when `flush()` is called explicitly. In browser environments
 * the client also flushes on `beforeunload` and when the tab is hidden.
 *
 * Event collection is disabled by default. Pass `consent: true` or call
 * `setConsent(true)` after the user grants permission before tracking events.
 *
 * @example
 * ```ts
 * const client = createFunnelClient({
 *   apiKey: "fjs_live_abc123",
 *   endpoint: "https://ingest.funelr.io/v1/collect",
 *   consent: true,
 * })
 *
 * client.track("page_view", { path: "/home" })
 * ```
 */
export function createFunnelClient(config: FunnelClientConfig): FunnelClient {
  try {
    new URL(config.endpoint)
  } catch {
    throw new Error(`[FunnelClient] Invalid endpoint URL: "${config.endpoint}"`)
  }

  let consentGiven = config.consent ?? false
  const batchSize = config.batchSize ?? 20
  const flushInterval = config.flushInterval ?? 5000
  const maxRetries = config.maxRetries ?? 3

  const queue: EventPayload[] = []
  let flushTimer: ReturnType<typeof setInterval> | undefined

  function startTimer(): void {
    if (flushTimer !== undefined) return
    flushTimer = setInterval(flush, flushInterval)
  }

  function stopTimer(): void {
    if (flushTimer !== undefined) {
      clearInterval(flushTimer)
      flushTimer = undefined
    }
  }

  function flush(): void {
    if (queue.length === 0) return
    const batch = queue.splice(0, queue.length)
    sendBatch({
      endpoint: config.endpoint,
      events: batch,
      ...(config.apiKey !== undefined ? { apiKey: config.apiKey } : {}),
      maxRetries,
    })
    stopTimer()
  }

  function getAnonymousId(): string | undefined {
    if (!consentGiven) return undefined
    return getOrCreateAnonymousId(config.anonymousIdStorageKey)
  }

  function getSessionId(): string | undefined {
    if (!consentGiven) return undefined
    return getOrCreateSessionId(config.sessionStorageKey)
  }

  function track(eventName: string, properties?: Record<string, unknown>): void {
    if (!consentGiven) return
    if (!isAllowedEventName(eventName, config.allowedEventNames)) return

    const anonymousId = getAnonymousId()
    const sessionId = getSessionId()
    const url = typeof location !== "undefined" ? location.href : undefined
    const referrer = typeof document !== "undefined" ? document.referrer || undefined : undefined

    const payload: EventPayload = {
      eventName,
      timestamp: new Date().toISOString(),
      sdkVersion: SDK_VERSION,
      ...(anonymousId !== undefined ? { anonymousId } : {}),
      ...(sessionId !== undefined ? { sessionId } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(referrer !== undefined ? { referrer } : {}),
      ...(properties !== undefined ? { properties } : {}),
    }

    queue.push(payload)
    startTimer()

    if (queue.length >= batchSize) {
      flush()
    }
  }

  function setConsent(given: boolean): void {
    consentGiven = given
    if (!given) {
      clearSessionId(config.sessionStorageKey)
      clearAnonymousId(config.anonymousIdStorageKey)
      queue.splice(0, queue.length)
      stopTimer()
    }
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === "hidden") flush()
  }

  function destroy(): void {
    flush()
    stopTimer()
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", flush)
      window.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", flush)
    window.addEventListener("visibilitychange", onVisibilityChange)
  }

  return { track, getSessionId, getAnonymousId, setConsent, flush, destroy }
}
