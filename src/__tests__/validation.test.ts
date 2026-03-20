import { describe, expect, it } from "vitest"
import { isAllowedEventName, isValidUUID } from "../validation.js"

describe("isValidUUID", () => {
  it("accepts a valid UUID v4", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })

  it("rejects an empty string", () => {
    expect(isValidUUID("")).toBe(false)
  })

  it("rejects a non-UUID string", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false)
  })

  it("rejects a UUID v1 (wrong version digit)", () => {
    expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false)
  })
})

describe("isAllowedEventName", () => {
  it("accepts any name when no allowlist is provided", () => {
    expect(isAllowedEventName("page_view")).toBe(true)
  })

  it("accepts a name present in the allowlist", () => {
    expect(isAllowedEventName("click", ["click", "submit"])).toBe(true)
  })

  it("rejects a name absent from the allowlist", () => {
    expect(isAllowedEventName("hack", ["click", "submit"])).toBe(false)
  })

  it("rejects an empty name", () => {
    expect(isAllowedEventName("")).toBe(false)
  })

  it("rejects a name exceeding the maximum length", () => {
    expect(isAllowedEventName("a".repeat(101))).toBe(false)
  })
})
