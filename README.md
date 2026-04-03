# @funelr/events

Official JavaScript/TypeScript SDK for [funelr.io](https://funelr.io) — event tracking with batching, consent management, and automatic session handling.

## Introduction

`@funelr/events` sends analytics events from browser applications to the funelr.io ingest API. Key characteristics:

- **Consent-first** — no data is collected until `setConsent(true)` is called
- **Batched delivery** — events are queued in memory and flushed by threshold, timer, or page lifecycle hooks
- **Resilient transport** — `sendBeacon` is preferred on page unload; `fetch` with exponential-backoff retry handles the rest
- **Zero config for sessions** — visitor and session identifiers are generated automatically via `crypto.randomUUID()` once consent is granted

## Requirements

- Node.js ≥ 22 (build / server-side usage)
- A modern browser with `crypto.randomUUID`, `sessionStorage`, and `fetch`

## Setup

```bash
npm install @funelr/events
```

### Basic initialisation

```ts
import { createFunnelClient } from "@funelr/events"

const client = createFunnelClient({
  apiKey: "fjs_live_abc123",
  endpoint: "https://ingest.funelr.io/v1/collect",
  consent: true, // or call client.setConsent(true) after cookie banner
})
```

### With deferred consent

```ts
const client = createFunnelClient({
  apiKey: "fjs_live_abc123",
  endpoint: "https://ingest.funelr.io/v1/collect",
  // consent defaults to false — nothing is tracked yet
})

// later, once the user accepts the cookie banner:
client.setConsent(true)
```

### With a custom domain (ad-block bypass)

On Pro and Scale plans, funelr.io supports routing events through your own subdomain (e.g. `collect.acme.com`). Ad blockers never block first-party requests.

Read the endpoint from an environment variable so switching domains requires no code change:

```ts
// Next.js / Vite / any bundler
const client = createFunnelClient({
  apiKey: process.env.NEXT_PUBLIC_FUNELR_API_KEY!,
  endpoint: process.env.NEXT_PUBLIC_FUNELR_ENDPOINT ?? "https://ingest.funelr.io/v1/collect",
})
```

Then set the variable in your deployment environment:

```bash
# .env.local (or Vercel / Railway / Netlify environment settings)
NEXT_PUBLIC_FUNELR_API_KEY=fjs_live_abc123
NEXT_PUBLIC_FUNELR_ENDPOINT=https://collect.acme.com/v1/collect
```

No code change needed when you configure or update your custom domain — only the environment variable changes.

> The custom domain and its DNS instructions are available in your project settings on the funelr.io dashboard once the domain is verified.

## Usage

### Tracking events

```ts
client.track("page_view")
client.track("cta_click", { label: "Get started", position: "hero" })
```

`track()` is a no-op when:
- consent has not been granted
- `allowedEventNames` is configured and `eventName` is not in the list

### Consent management

```ts
// grant
client.setConsent(true)

// revoke — flushes nothing, clears queue and stored IDs
client.setConsent(false)
```

### Reading identifiers

```ts
const sessionId   = client.getSessionId()   // scoped to the current tab (sessionStorage)
const anonymousId = client.getAnonymousId() // persistent across sessions (localStorage)
```

Both return `undefined` when consent has not been granted or the storage API is unavailable (e.g. SSR).

### Manual flush and teardown

```ts
// send all queued events immediately
client.flush()

// flush, stop the timer, and remove page-lifecycle listeners
client.destroy()
```

Call `destroy()` when unmounting a SPA layout or in framework cleanup hooks.

### Configuration reference

| Option | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | — | Base URL of the ingest API (**required**) |
| `apiKey` | `string` | — | API key sent as `X-Api-Key` header |
| `consent` | `boolean` | `false` | Initial consent state |
| `allowedEventNames` | `readonly string[]` | — | Allowlist — unknown names are silently dropped |
| `batchSize` | `number` | `20` | Queue length that triggers an automatic flush |
| `flushInterval` | `number` | `5000` | Periodic flush interval in milliseconds |
| `maxRetries` | `number` | `3` | Retry attempts on network errors or 5xx responses |
| `sessionStorageKey` | `string` | `"funnel_session_id"` | Custom key for `sessionStorage` |
| `anonymousIdStorageKey` | `string` | `"funnel_anonymous_id"` | Custom key for `localStorage` |

## Server-side payload validation

The Zod schema is exported for use in API routes or test assertions:

```ts
import { eventPayloadSchema } from "@funelr/events"

const result = eventPayloadSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json(result.error)
}
```

## Standalone utilities

Session and validation helpers can be used independently of `createFunnelClient`:

```ts
import {
  getOrCreateSessionId,
  getOrCreateAnonymousId,
  clearSessionId,
  clearAnonymousId,
  isValidUUID,
  isAllowedEventName,
} from "@funelr/events"
```

## Source structure

```
src/
├── client.ts       # createFunnelClient — public API, batching, consent gate
├── transport.ts    # sendBatch — fetch + sendBeacon + retry logic
├── session.ts      # getOrCreateSessionId / getOrCreateAnonymousId
├── validation.ts   # isValidUUID, isAllowedEventName
├── schemas.ts      # Zod schema (eventPayloadSchema) and EventPayload type
├── types.ts        # TypeScript types for Stats & Analytics API responses
├── constants.ts    # SDK_VERSION, field length limits, UUID_V4_REGEX
└── index.ts        # public re-exports
```

## Development

```bash
npm run build        # compile to dist/
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run test:watch   # vitest (watch mode)
npm run lint         # biome check
npm run lint:fix     # biome check --write
```

## License

MIT
