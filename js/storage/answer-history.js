/**
 * Remembers the last mark for each question in this browser (localStorage).
 * Used by the "questions I got wrong before" filter and the Study map colours.
 * If storage is unavailable, history simply lasts for the visit.
 */

import { isFullMarks } from "../core/attempt.js";

const STORAGE_KEY = "cssp-exam-prep:v1";

export function createAnswerHistory(storage = browserStorage()) {
  const entries = load();

  function load() {
    try { return JSON.parse(storage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
  }

  function save() {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* storage unavailable: keep in memory */ }
  }

  return {
    record(questionId, score) {
      const entry = entries[questionId] || { n: 0, last: 0 };
      entry.n += 1;
      entry.last = score;
      entries[questionId] = entry;
      save();
    },
    /** Last mark for a question, or null if never answered here. */
    lastScore(questionId) {
      return entries[questionId] ? entries[questionId].last : null;
    },
    /** Ids of questions whose last answer was below full marks, limited to ids that still exist. */
    missedIds(existingIds) {
      return new Set(existingIds.filter(id => entries[id] && !isFullMarks(entries[id].last)));
    }
  };
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return memoryStorage(); }
}

function memoryStorage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
}
