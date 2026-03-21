# Funelr Events — Setup & Tracking

You are helping a developer instrument their application with `@funelr/events`.

## Phase 1 — Discovery (run before writing any code)

Use `EnterPlanMode` to ask the following questions. Do not write code yet.

### Questions to ask

**1. Module / namespace**
Ask which feature or module they want to instrument (e.g. authentication, checkout, onboarding, navigation). This becomes the event namespace prefix. All event names follow the convention `namespace:action` — for example `auth:login`, `cart:add_item`, `onboarding:step_completed`.

**2. Events to track**
Ask what specific user actions to track within that module. For each action, derive a namespaced event name and ask what contextual data (properties) is relevant. Example: "user submits login form" → `auth:login` with properties `{ method: "email" | "oauth", success: boolean }`.

**3. Client initialization**
Ask whether `createFunnelClient` is already set up somewhere in the project. If not, ask for:
- Their Funelr API key (format: `fnnl_live_...` or `fnnl_test_...`)
- Their ingest endpoint (e.g. `https://ingest.funelr.io/v1/collect`)
- Whether they want to use `allowedEventNames` to enforce the event list at the SDK level

**4. Consent**
Ask how cookie / tracking consent is currently managed in the project:
- No consent management yet (default to `consent: true` for now, flag as tech debt)
- Existing cookie banner or consent hook (ask where — component name, store, context)
- Will be added later (initialize with `consent: false`, show where to call `setConsent(true)`)

**5. Framework**
Auto-detect the framework from `package.json` dependencies and confirm with the user. Common cases:
- React / Next.js → singleton module + hook or context
- Vue / Nuxt → singleton module or composable
- Vanilla JS / other → singleton module

---

## Phase 2 — Implementation plan

Still in plan mode, present the implementation plan:

1. List all namespaced event names to be added (e.g. `auth:login`, `auth:logout`)
2. Show the `allowedEventNames` array if the user opted in
3. Show where the client singleton will be created or found
4. Show which files will receive `client.track(...)` calls and where exactly
5. Show how consent will be wired (or flag it as a TODO)

Wait for the user to confirm before proceeding.

---

## Phase 3 — Implementation

Exit plan mode and implement in this order:

### Step 1 — Verify installation

Check `package.json` for `@funelr/events`. If absent, instruct the user to run the appropriate install command and stop until they confirm it is installed.

### Step 2 — Client singleton

If no client exists, create a singleton file appropriate for the framework:

**React / Next.js** — `src/lib/funelr.ts` (or `lib/funelr.ts`):
```ts
import { createFunnelClient } from "@funelr/events"

export const funelr = createFunnelClient({
  endpoint: "https://ingest.funelr.io/v1/collect",
  apiKey: process.env.NEXT_PUBLIC_FUNELR_API_KEY,
  consent: false, // update via funelr.setConsent(true) after user consent
  allowedEventNames: [
    // list all namespaced event names here if opted in
  ],
})
```

**Vue / Nuxt** — `src/plugins/funelr.ts` or `composables/useFunelr.ts`.

**Vanilla** — `src/funelr.ts`.

Always use environment variables for the API key. Never hardcode it.

### Step 3 — Consent wiring

Wire `funelr.setConsent(true/false)` into the existing consent mechanism. Common patterns:

- **Cookie banner callback**: call `funelr.setConsent(true)` in the accept handler, `funelr.setConsent(false)` in the reject/revoke handler
- **Zustand / Pinia store**: call `funelr.setConsent(value)` in the consent action
- **React context**: call inside a `useEffect` watching the consent state
- **No consent yet**: initialize with `consent: true` and add a `// TODO: wire consent` comment

### Step 4 — Add tracking calls

For each agreed event, add `funelr.track("namespace:action", { ...properties })` at the correct location. Follow these rules:

- Import the singleton, never instantiate a new client
- Place the call as close as possible to the user action (button handler, form submit, route change)
- Keep properties flat and serializable (strings, numbers, booleans) — no class instances or functions
- Never include PII (email, name, phone) in properties — the server scrubs known PII keys but avoid it at the source

### Step 5 — Destroy on unmount (SPA only)

If the client is mounted inside a component or layout (not a module-level singleton), call `funelr.destroy()` in the cleanup. For module-level singletons this is not needed.

---

## Key constraints to respect

- **Endpoint**: the SDK appends `/batch` automatically — do not include `/batch` in the `endpoint` config
- **API key**: always from an environment variable (`NEXT_PUBLIC_`, `VITE_`, or server-only depending on context)
- **Batch max**: the server accepts up to 100 events per batch; the SDK default of 20 is fine
- **Event name length**: max 100 characters — namespaced names are typically well within this
- **No siteId**: `siteId` is a removed legacy field — never use it
- **allowedEventNames**: when provided, events not in the list are silently dropped — keep the singleton and the list in sync

---

## Event naming reference

| Pattern | Example |
|---------|---------|
| `auth:action` | `auth:login`, `auth:logout`, `auth:signup` |
| `page:action` | `page:view`, `page:scroll_depth` |
| `cart:action` | `cart:add_item`, `cart:remove_item`, `cart:checkout` |
| `onboarding:action` | `onboarding:step_completed`, `onboarding:skipped` |
| `ui:action` | `ui:modal_opened`, `ui:cta_clicked` |
| `form:action` | `form:submitted`, `form:abandoned` |

Use `snake_case` for both the namespace and the action. Keep actions as verbs or verb phrases in past tense when they represent completed actions.
