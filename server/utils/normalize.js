/**
 * SmartTravel Data Normalization Utilities
 * Safe handling of array-like fields across Mongoose models and AI payloads.
 */

/**
 * Normalizes any value into a clean array of strings.
 * Rules:
 * 1. Array of values: filters and trims non-empty strings/numbers, drops unexpected objects/nulls.
 * 2. Non-empty string: converts to a one-element array [trimmedString].
 * 3. Number: converts to a one-element array [String(number)].
 * 4. Missing / null / undefined / empty string: returns [].
 * 5. Unexpected objects: returns [] safely without throwing or producing "[object Object]".
 *
 * @param {*} val - Any input value
 * @returns {string[]} An array of normalized strings
 */
export function normalizeStringArray(val) {
  if (val === null || val === undefined) {
    return [];
  }

  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'number' && !isNaN(item)) return String(item);
        return null;
      })
      .filter((item) => typeof item === 'string' && item.length > 0);
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  if (typeof val === 'number' && !isNaN(val)) {
    return [String(val)];
  }

  // Handle unexpected objects (e.g. {}, Date, RegExp, functions, symbols, booleans)
  // Safely avoid throwing and avoid converting into meaningless strings like "[object Object]".
  return [];
}

/**
 * Formats any string or array-like field into a joined string representation.
 *
 * @param {*} val - Any input value
 * @param {Object} options
 * @param {string} [options.fallback=''] - String returned if array is empty
 * @param {string} [options.separator=', '] - Separator used when joining elements
 * @returns {string} Joined string
 */
export function formatStringList(val, { fallback = '', separator = ', ' } = {}) {
  const arr = normalizeStringArray(val);
  return arr.length > 0 ? arr.join(separator) : fallback;
}
