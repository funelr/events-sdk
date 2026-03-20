// ---------------------------------------------------------------------------
// Convention: nullable fields in API response types use `null` (mirrors JSON).
// Optional fields in request/config types use `undefined` (TypeScript idiom).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Funnel configuration
// ---------------------------------------------------------------------------

/** A single step in a funnel definition. */
export interface FunnelStep {
  /** Event name that represents reaching this step. */
  eventName: string
  /** Human-readable label shown in the dashboard. */
  label: string
}

/** Configuration for a funnel, as returned by the funelr.io API. */
export interface FunnelConfig {
  /** UUID of the project this funnel belongs to. */
  siteId: string
  /** Ordered list of steps that define the funnel. */
  steps: FunnelStep[]
}

// ---------------------------------------------------------------------------
// Stats API — response types
// ---------------------------------------------------------------------------

/** Response from `GET /v1/stats/:projectId/summary`. */
export interface FunnelSummaryResponse {
  /** Start of the requested period (ISO 8601). */
  from: string
  /** End of the requested period (ISO 8601). */
  to: string
  /** Number of unique `anonymous_id` values observed in the period. */
  visitors: number
  /** Total event count keyed by `event_name`. */
  eventTotals: Record<string, number>
}

/** A single step entry within a {@link FunnelStatsResponse}. */
export interface FunnelStepStat {
  step_order: number
  name: string
  event_name: string
  users_reached: number
  /** Conversion rate relative to the first step, or `null` for the first step itself. */
  conversion_from_first: number | null
  /** Conversion rate relative to the previous step, or `null` for the first step. */
  conversion_from_prev: number | null
}

/** Response from `GET /v1/stats/:projectId/funnels/:funnelId`. */
export interface FunnelStatsResponse {
  funnelId: string
  funnelName: string
  from: string
  to: string
  overallConversionRate: number
  steps: FunnelStepStat[]
}

/** A single time-series data point within a {@link TrendsResponse}. */
export interface TrendDataPoint {
  /** Bucket start time (ISO 8601). */
  bucket: string
  event_count: number
  unique_visitors: number
}

/** Response from `GET /v1/stats/:projectId/trends`. */
export interface TrendsResponse {
  series: Array<{ eventName: string; data: TrendDataPoint[] }>
}

/** A single row from `GET /analytics/:projectId/events/top`. */
export interface TopEventStat {
  event_name: string
  total_count: number
  unique_visitors: number
}

/** A single row from `GET /analytics/:projectId/property-breakdown`. */
export interface PropertyBreakdownItem {
  value: string
  count: number
}

/** A single event record from `GET /analytics/:projectId/raw-events`. */
export interface RawEvent {
  id: string
  event_name: string
  anonymous_id: string
  properties: Record<string, unknown> | null
  server_received_at: string
}

/** Response from `GET /analytics/:projectId/raw-events`. */
export interface RawEventsResponse {
  events: RawEvent[]
  total: number
  limit: number
  offset: number
}

/** A single event record from `GET /analytics/:projectId/sessions/:anonymousId/events`. */
export interface SessionEvent {
  id: string
  event_name: string
  properties: Record<string, unknown> | null
  url: string | null
  referrer: string | null
  server_received_at: string
  client_sent_at: string | null
}
