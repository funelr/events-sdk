import { describe, expect, it } from "vitest"
import { eventPayloadSchema } from "../schemas.js"

describe("eventPayloadSchema", () => {
  const validPayload = {
    eventName: "page_view",
  }

  it("accepts a minimal valid payload", () => {
    expect(eventPayloadSchema.safeParse(validPayload).success).toBe(true)
  })

  it("accepts a full payload", () => {
    const result = eventPayloadSchema.safeParse({
      ...validPayload,
      anonymousId: "anon-uuid-1234",
      sessionId: "abc-123",
      url: "https://example.com/page",
      referrer: "https://google.com",
      properties: { button: "cta" },
      timestamp: "2025-01-01T00:00:00Z",
      sdkVersion: "0.3.0",
    })
    expect(result.success).toBe(true)
  })

  it("accepts an empty string referrer", () => {
    expect(eventPayloadSchema.safeParse({ ...validPayload, referrer: "" }).success).toBe(true)
  })

  it("accepts anonymousId and sdkVersion fields", () => {
    const result = eventPayloadSchema.safeParse({
      eventName: "page_view",
      anonymousId: "anon-uuid-1234",
      sdkVersion: "0.3.0",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty eventName", () => {
    expect(eventPayloadSchema.safeParse({ ...validPayload, eventName: "" }).success).toBe(false)
  })

  it("rejects an eventName exceeding the maximum length", () => {
    expect(
      eventPayloadSchema.safeParse({ ...validPayload, eventName: "a".repeat(101) }).success,
    ).toBe(false)
  })
})
