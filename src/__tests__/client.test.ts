import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createFunnelClient } from "../client.js"

const API_KEY = "fjs_live_test1234"

describe("createFunnelClient", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetchSpy)
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => true) })
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("returns undefined sessionId when consent is not given", () => {
    const client = createFunnelClient({ apiKey: API_KEY, endpoint: "http://localhost/api/events" })
    expect(client.getSessionId()).toBeUndefined()
  })

  it("returns a sessionId when consent is given", () => {
    const client = createFunnelClient({ apiKey: API_KEY, endpoint: "http://localhost/api/events", consent: true })
    expect(client.getSessionId()).toBeDefined()
  })

  it("returns undefined anonymousId when consent is not given", () => {
    const client = createFunnelClient({ apiKey: API_KEY, endpoint: "http://localhost/api/v1/collect" })
    expect(client.getAnonymousId()).toBeUndefined()
  })

  it("returns an anonymousId when consent is given", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/v1/collect",
      consent: true,
    })
    expect(client.getAnonymousId()).toBeDefined()
  })

  it("toggles consent at runtime", () => {
    const client = createFunnelClient({ apiKey: API_KEY, endpoint: "http://localhost/api/events" })
    expect(client.getSessionId()).toBeUndefined()

    client.setConsent(true)
    expect(client.getSessionId()).toBeDefined()

    client.setConsent(false)
    expect(client.getSessionId()).toBeUndefined()
  })

  it("does not send any data when consent is not given", () => {
    const client = createFunnelClient({ apiKey: API_KEY, endpoint: "http://localhost/api/events" })
    client.track("page_view")
    client.flush()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(navigator.sendBeacon).not.toHaveBeenCalled()
  })

  it("flushes queued events on explicit flush()", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/v1/collect",
      consent: true,
      batchSize: 100,
    })

    client.track("page_view")
    expect(fetchSpy).not.toHaveBeenCalled()

    client.flush()
    expect(navigator.sendBeacon).toHaveBeenCalledOnce()
    expect(navigator.sendBeacon).toHaveBeenCalledWith(
      "http://localhost/api/v1/collect/batch",
      expect.any(Blob),
    )
  })

  it("auto-flushes when batchSize is reached", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/v1/collect",
      consent: true,
      batchSize: 2,
    })

    client.track("event_1")
    expect(navigator.sendBeacon).not.toHaveBeenCalled()

    client.track("event_2")
    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it("skips tracking when eventName is not in allowlist", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/events",
      consent: true,
      allowedEventNames: ["page_view"],
    })

    client.track("unknown_event")
    client.flush()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(navigator.sendBeacon).not.toHaveBeenCalled()
  })

  it("tracks when eventName is in allowlist", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/v1/collect",
      consent: true,
      allowedEventNames: ["page_view", "click"],
    })

    client.track("page_view")
    client.flush()
    expect(navigator.sendBeacon).toHaveBeenCalledOnce()
  })

  it("uses custom sessionStorageKey", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/events",
      consent: true,
      sessionStorageKey: "my_project_session",
    })

    const sessionId = client.getSessionId()
    expect(sessionId).toBeDefined()
    expect(sessionStorage.getItem("my_project_session")).toBe(sessionId)
    expect(sessionStorage.getItem("funnel_session_id")).toBeNull()
  })

  it("clears sessionId on consent revocation", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/events",
      consent: true,
      sessionStorageKey: "my_project_session",
    })

    client.getSessionId()
    expect(sessionStorage.getItem("my_project_session")).toBeDefined()

    client.setConsent(false)
    expect(sessionStorage.getItem("my_project_session")).toBeNull()
  })

  it("clears queued events on consent revocation", () => {
    const client = createFunnelClient({
      apiKey: API_KEY,
      endpoint: "http://localhost/api/v1/collect",
      consent: true,
      batchSize: 100,
    })

    client.track("page_view")
    client.setConsent(false)
    client.flush()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(navigator.sendBeacon).not.toHaveBeenCalled()
  })
})
