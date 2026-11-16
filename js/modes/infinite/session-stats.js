/**
 * Numbers about the current Infinite session, for the side panel and the summary.
 */

import { isFullMarks } from "../../core/attempt.js";

export function sessionStats(engineState) {
  const history = engineState.history;
  const fullyRight = history.filter(h => isFullMarks(h.score)).length;
  let streak = 0;
  for (let i = history.length - 1; i >= 0 && isFullMarks(history[i].score); i--) streak++;
  return {
    answered: history.length,
    fullyRight,
    percentRight: history.length ? Math.round((100 * fullyRight) / history.length) : 0,
    averageMark: history.length ? history.reduce((sum, h) => sum + h.score, 0) / history.length : 0,
    streak,
    toRevisit: engineState.misses.size
  };
}

/** Concepts behind this session's misses, most-missed first: [[conceptId, missCount], ...]. */
export function weakConcepts(engineState, graph) {
  const counts = new Map();
  engineState.history
    .filter(h => !isFullMarks(h.score))
    .forEach(h => graph.conceptsOf(h.id).forEach(c => counts.set(c, (counts.get(c) || 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
