import { EVENT_NAME_MAX_LENGTH, UUID_V4_REGEX } from "./constants.js"

/**
 * Returns `true` when `value` is a well-formed UUID v4 string.
 *
 * @example
 * isValidUUID("550e8400-e29b-41d4-a716-446655440000") // true
 * isValidUUID("not-a-uuid")                           // false
 */
export function isValidUUID(value: string): boolean {
  return UUID_V4_REGEX.test(value)
}

/**
 * Returns `true` when `name` is a non-empty string within the allowed length
 * and, if `allowedNames` is provided, is present in that allowlist.
 *
 * @example
 * isAllowedEventName("page_view")                        // true (no allowlist)
 * isAllowedEventName("page_view", ["page_view", "click"]) // true
 * isAllowedEventName("unknown",   ["page_view", "click"]) // false
 */
export function isAllowedEventName(name: string, allowedNames?: readonly string[]): boolean {
  if (name.length === 0 || name.length > EVENT_NAME_MAX_LENGTH) return false
  if (!allowedNames) return true
  return allowedNames.includes(name)
}
