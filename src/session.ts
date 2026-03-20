const DEFAULT_SESSION_KEY = "funnel_session_id"
const DEFAULT_ANONYMOUS_KEY = "funnel_anonymous_id"

function isBrowser(): boolean {
  return (
    typeof globalThis.crypto !== "undefined" && typeof globalThis.sessionStorage !== "undefined"
  )
}

/**
 * Returns the session ID stored under `key`, creating and persisting a new
 * UUID v4 if none exists. Returns `undefined` when called outside a browser
 * context (e.g. SSR).
 *
 * The ID is scoped to the current browser tab via `sessionStorage` and is
 * cleared automatically when the tab is closed.
 */
export function getOrCreateSessionId(key?: string): string | undefined {
  if (!isBrowser()) return undefined

  const storageKey = key ?? DEFAULT_SESSION_KEY
  const existing = sessionStorage.getItem(storageKey)
  if (existing) return existing

  const id = crypto.randomUUID()
  sessionStorage.setItem(storageKey, id)
  return id
}

/**
 * Removes the session ID from `sessionStorage`.
 *
 * Call this when the user revokes tracking consent.
 */
export function clearSessionId(key?: string): void {
  if (!isBrowser()) return
  sessionStorage.removeItem(key ?? DEFAULT_SESSION_KEY)
}

/**
 * Returns the persistent anonymous visitor ID stored under `key`, creating
 * and persisting a new UUID v4 if none exists. Returns `undefined` outside a
 * browser context or when `localStorage` is unavailable.
 *
 * The ID is stored in `localStorage` and persists across sessions.
 * It must only be created after the user has granted consent.
 */
export function getOrCreateAnonymousId(key?: string): string | undefined {
  if (!isBrowser() || typeof localStorage === "undefined") return undefined

  const storageKey = key ?? DEFAULT_ANONYMOUS_KEY
  const existing = localStorage.getItem(storageKey)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(storageKey, id)
  return id
}

/**
 * Removes the anonymous visitor ID from `localStorage`.
 *
 * Call this when the user revokes tracking consent.
 */
export function clearAnonymousId(key?: string): void {
  if (!isBrowser() || typeof localStorage === "undefined") return
  localStorage.removeItem(key ?? DEFAULT_ANONYMOUS_KEY)
}
