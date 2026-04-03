// Browser-only entrypoint — excludes zod schemas (server-side only)
export { createFunnelClient, type FunnelClient, type FunnelClientConfig } from "./client.js"
export type { FunnelConfig } from "./types.js"
