import { z } from "zod"
import { EVENT_NAME_MAX_LENGTH, SESSION_ID_MAX_LENGTH, URL_MAX_LENGTH } from "./constants.js"

/**
 * Zod schema for validating an ingest event payload.
 *
 * Mirrors the server-side contract accepted by `POST /v1/collect/batch`.
 * Use this schema on the server or in tests to assert payload correctness.
 */
export const eventPayloadSchema = z.object({
  /** Name of the event, e.g. `"page_view"` or `"cta_click"`. */
  eventName: z.string().min(1).max(EVENT_NAME_MAX_LENGTH),
  /** Persistent visitor identifier stored in `localStorage` (post-consent). */
  anonymousId: z.string().min(1).max(SESSION_ID_MAX_LENGTH).optional(),
  /** Session-scoped identifier stored in `sessionStorage`. */
  sessionId: z.string().max(SESSION_ID_MAX_LENGTH).optional(),
  /** Full URL of the page where the event occurred. */
  url: z.string().url().max(URL_MAX_LENGTH).optional(),
  /** HTTP referrer. An empty string is accepted when no referrer is present. */
  referrer: z.string().url().max(URL_MAX_LENGTH).optional().or(z.literal("")),
  /** Arbitrary key/value properties attached to the event. */
  properties: z.record(z.string(), z.unknown()).optional(),
  /** ISO 8601 timestamp recorded on the client at the time of the event. */
  timestamp: z.string().datetime().optional(),
  /** Version string of the SDK that produced this payload, e.g. `"0.3.0"`. */
  sdkVersion: z.string().optional(),
})

/** Ingest event payload — the unit of data sent to `POST /v1/collect/batch`. */
export type EventPayload = z.infer<typeof eventPayloadSchema>
