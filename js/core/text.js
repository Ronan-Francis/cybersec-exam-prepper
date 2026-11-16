/**
 * Text and array helpers used across the app. No DOM access.
 */

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes a value for safe use inside HTML text or attribute values. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/** Escapes text and turns `backtick` spans into <code> elements. */
export function formatInline(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** Returns a shuffled copy of the array (Fisher-Yates). */
export function shuffle(items, random = Math.random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Returns a shuffled copy that is always the same for the same seed.
 * Used where an order must stay stable between renders, such as Study mode previews.
 */
export function seededShuffle(items, seed) {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const nextRandom = () => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return hash / 2 ** 32;
  };
  return shuffle(items, nextRandom);
}

/** Formats a chapter number with two digits, for example 3 becomes "03". */
export function pad2(n) {
  return String(n).padStart(2, "0");
}

/** "1 question" or "3 questions". */
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
