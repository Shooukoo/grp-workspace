/**
 * Splits a raw comma-separated string into a clean string[].
 * Each entry is trimmed and lowercased for consistent searches.
 * Returns null when the input is blank.
 */
export function parseCompatibility(raw: string): string[] | null {
  const arr = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return arr.length > 0 ? arr : null
}
