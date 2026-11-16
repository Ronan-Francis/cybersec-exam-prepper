/**
 * Formatting for times and dates shown in the interface.
 */

import { pad2 } from "../core/text.js";

/** "4 min 12 sec" */
export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return (hours ? `${hours} hr ` : "") + (minutes || hours ? `${minutes} min ` : "") + `${seconds} sec`;
}

/** "04:12" */
export function formatStopwatch(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** "Monday 16 November 2026 at 14:03" */
export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
