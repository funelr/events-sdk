import { afterEach, describe, expect, it } from "vitest"
import { clearSessionId, getOrCreateSessionId } from "../session.js"

describe("session", () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it("generates a UUID v4 session id", () => {
    const id = getOrCreateSessionId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it("returns the same id on subsequent calls", () => {
    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()
    expect(first).toBe(second)
  })

  it("generates a new id after clearing", () => {
    const original = getOrCreateSessionId()
    clearSessionId()
    const newId = getOrCreateSessionId()
    expect(newId).toBeDefined()
    expect(newId).not.toBe(original)
  })

  it("uses a custom storage key", () => {
    const id = getOrCreateSessionId("my_custom_key")
    expect(id).toBeDefined()
    expect(sessionStorage.getItem("my_custom_key")).toBe(id)
    expect(sessionStorage.getItem("funnel_session_id")).toBeNull()
  })

  it("clears the custom storage key", () => {
    const id = getOrCreateSessionId("my_custom_key")
    expect(id).toBeDefined()
    clearSessionId("my_custom_key")
    expect(sessionStorage.getItem("my_custom_key")).toBeNull()
  })

  it("isolates sessions between different keys", () => {
    const defaultId = getOrCreateSessionId()
    const customId = getOrCreateSessionId("project_session")
    expect(defaultId).toBeDefined()
    expect(customId).toBeDefined()
    expect(defaultId).not.toBe(customId)
  })
})
