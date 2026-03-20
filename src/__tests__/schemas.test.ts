import { describe, expect, it } from "vitest"
import { eventPayloadSchema } from "../schemas.js"

describe("eventPayloadSchema", () => {
  const validPayload = {
    siteId: "550e8400-e29b-41d4-a716-446655440000",
    eventName: "page_view",
  }

  it("accepts a minimal valid payload", () => {
    expect(eventPayloadSchema.safeParse(validPayload).success).toBe(true)
  })

  it("accepts a full payload", () => {
    const result = eventPayloadSchema.safeParse({
      ...validPayload,
      sessionId: "abc-123",
      url: "https://example.com/page",
      referrer: "https://google.com",
      properties: { button: "cta" },
      timestamp: "2025-01-01T00:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("accepts an empty string referrer", () => {
    expect(eventPayloadSchema.safeParse({ ...validPayload, referrer: "" }).success).toBe(true)
  })

  it("accepts a payload without siteId (v0.3.0+ mode)", () => {
    expect(eventPayloadSchema.safeParse({ eventName: "click" }).success).toBe(true)
  })

  it("accepts anonymousId and sdkVersion fields (v0.3.0+)", () => {
    const result = eventPayloadSchema.safeParse({
      eventName: "page_view",
      anonymousId: "anon-uuid-1234",
      sdkVersion: "0.3.0",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid siteId (not a UUID)", () => {
    expect(eventPayloadSchema.safeParse({ siteId: "not-a-uuid", eventName: "click" }).success).toBe(
      false,
    )
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
