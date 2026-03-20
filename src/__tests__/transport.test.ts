import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { sendBatch, sendLegacy } from "../transport.js"

describe("sendLegacy (v0.2.x compat)", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => true) })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("uses sendBeacon when available", () => {
    sendLegacy({ endpoint: "/api/events", payload: { eventName: "page_view" } })
    expect(navigator.sendBeacon).toHaveBeenCalledOnce()
    expect(navigator.sendBeacon).toHaveBeenCalledWith("/api/events", expect.any(Blob))
  })

  it("falls back to fetch when sendBeacon returns false", () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => false) })
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetchSpy)

    sendLegacy({ endpoint: "/api/events", payload: { eventName: "page_view" } })
    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it("falls back to fetch when sendBeacon is not available", () => {
    vi.stubGlobal("navigator", {})
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetchSpy)

    sendLegacy({ endpoint: "/api/events", payload: { eventName: "page_view" } })
    expect(fetchSpy).toHaveBeenCalledOnce()
  })
})

describe("sendBatch (v0.3.0+)", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("does nothing when events array is empty", () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetchSpy)
    sendBatch({ endpoint: "/api/v1/collect", events: [], apiKey: "key_test" })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("uses sendBeacon for a single event", () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => true) })
    const event = { eventName: "page_view", anonymousId: "anon-1" }
    sendBatch({ endpoint: "/api/v1/collect", events: [event], apiKey: "key_test" })
    expect(navigator.sendBeacon).toHaveBeenCalledWith("/api/v1/collect/batch", expect.any(Blob))
  })

  it("uses fetch for multiple events", () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => true) })
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetchSpy)
    const events = [
      { eventName: "page_view", anonymousId: "anon-1" },
      { eventName: "click", anonymousId: "anon-1" },
    ]
    sendBatch({ endpoint: "/api/v1/collect", events, apiKey: "key_test" })
    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/v1/collect/batch",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("sets X-Api-Key header when apiKey is provided", () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetchSpy)
    vi.stubGlobal("navigator", {})
    const events = [
      { eventName: "ev1", anonymousId: "a" },
      { eventName: "ev2", anonymousId: "a" },
    ]
    sendBatch({ endpoint: "/api/v1/collect", events, apiKey: "my_api_key" })
    const [, options] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    const headers = options.headers as Record<string, string>
    expect(headers["X-Api-Key"]).toBe("my_api_key")
  })
})
