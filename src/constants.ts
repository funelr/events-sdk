/** Current version of the SDK, injected into every event payload. */
export const SDK_VERSION = "0.4.0"

/** Maximum allowed length for event names. */
export const EVENT_NAME_MAX_LENGTH = 100

/** Maximum allowed length for session and anonymous identifier fields. */
export const SESSION_ID_MAX_LENGTH = 64

/** Maximum allowed length for URL and referrer fields. */
export const URL_MAX_LENGTH = 2048

/** Regular expression that matches a UUID v4 string. */
export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
