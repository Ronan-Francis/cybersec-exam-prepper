/**
 * Chooses the next question in Infinite mode by following misses through the question graph.
 *
 * Each pick, in priority order:
 *   1. Re-ask: a missed question comes back once 3 others have been asked (at most one re-ask in every three picks).
 *   2. Similar: about 85% of the time while misses are outstanding, one of the 3 questions most strongly linked to a miss.
 *   3. Focus: with a focus concept, that concept's open questions, then its nearest neighbours.
 *   4. Explore: an unseen question from the least-covered chapter (called "warm-up" before the first miss).
 *
 * Recording a fully right answer clears that question as a miss and weakens misses it is strongly linked to.
 * Anything below full marks counts as a miss.
 */

import { isFullMarks } from "./attempt.js";

const RECENT_WINDOW = 4;          // never repeat a question within this many picks
const REASK_AFTER = 3;            // questions between a miss and its re-ask
const REASK_SPACING = 3;          // at most one re-ask in this many picks
const EXPLORE_CHANCE = 0.15;      // chance of exploring even while misses are outstanding
const STRONG_LINK = 0.6;          // links at or above this count as "the same idea"
const SIMILAR_SHORTLIST = 3;      // pick among this many best candidates
const ALREADY_RIGHT_FACTOR = 0.3; // de-prioritise questions already answered right this session
const ALREADY_SEEN_FACTOR = 0.6;  // and, less so, questions already seen
const FOCUS_BONUS = 0.3;          // boost for the focus concept's questions
const MISS_DECAY = 0.6;           // a miss weakens by this factor when a linked question is answered right
const MISS_DROP_BELOW = 0.25;     // and stops driving picks below this strength

export function createInfiniteEngine(graph, { focus = null, random = Math.random } = {}) {
  const state = {
    focus,
    history: [],             // [{ id, score }] in the order answered
    misses: new Map(),       // id -> { strength }
    reasks: [],              // [{ id, dueAt, missedAt }]
    answeredRight: new Set(),
    timesAsked: new Map(),
    lastReaskAt: -Infinity
  };
  const recentWindow = Math.min(RECENT_WINDOW, graph.questionIds.length - 1);

  function next() {
    const position = state.history.length;
    const recent = new Set(state.history.slice(-recentWindow).map(h => h.id));
    return pickReask(position, recent)
      || pickSimilar(recent)
      || pickFocus(recent)
      || pickExplore(recent);
  }

  function pickReask(position, recent) {
    if (position - state.lastReaskAt < REASK_SPACING) return null;
    const index = state.reasks.findIndex(r => r.dueAt <= position && !recent.has(r.id));
    if (index < 0) return null;
    const [reask] = state.reasks.splice(index, 1);
    state.lastReaskAt = position;
    return { id: reask.id, reason: { type: "reask", questionsAgo: position - reask.missedAt + 1 } };
  }

  function pickSimilar(recent) {
    if (!state.misses.size || random() < EXPLORE_CHANCE) return null;
    const focusQuestions = state.focus ? graph.questionsFor(state.focus) : [];
    const candidates = [];
    for (const id of graph.questionIds) {
      if (recent.has(id) || state.misses.has(id)) continue;
      const { score, from } = closestMiss(id);
      let priority = score;
      if (state.answeredRight.has(id)) priority *= ALREADY_RIGHT_FACTOR;
      else if (state.timesAsked.has(id)) priority *= ALREADY_SEEN_FACTOR;
      if (focusQuestions.includes(id)) priority += FOCUS_BONUS;
      if (priority > 0) candidates.push({ id, priority, from });
    }
    candidates.sort((a, b) => b.priority - a.priority);
    const choice = weightedPick(candidates.slice(0, SIMILAR_SHORTLIST));
    if (!choice) return null;
    return { id: choice.id, reason: { type: "similar", from: choice.from, strength: graph.strength(choice.from, choice.id) } };
  }

  /** The outstanding miss this question is most strongly linked to, weighted by how strong that miss still is. */
  function closestMiss(id) {
    let score = 0, from = null;
    state.misses.forEach((miss, missedId) => {
      const s = graph.strength(missedId, id) * miss.strength;
      if (s > score) { score = s; from = missedId; }
    });
    return { score, from };
  }

  function pickFocus(recent) {
    if (!state.focus) return null;
    const focusQuestions = graph.questionsFor(state.focus);
    const open = focusQuestions.filter(id => !recent.has(id) && !state.answeredRight.has(id));
    if (open.length) {
      const unseen = open.filter(id => !state.timesAsked.has(id));
      return { id: randomItem(unseen.length ? unseen : open), reason: { type: "focus" } };
    }
    let best = null;
    for (const id of graph.questionIds) {
      if (recent.has(id) || state.answeredRight.has(id) || focusQuestions.includes(id)) continue;
      const strength = Math.max(...focusQuestions.map(f => graph.strength(f, id)));
      if (!best || strength > best.strength) best = { id, strength };
    }
    return best ? { id: best.id, reason: { type: "focus-near", strength: best.strength } } : null;
  }

  function pickExplore(recent) {
    const available = graph.questionIds.filter(id => !recent.has(id));
    const unseen = available.filter(id => !state.timesAsked.has(id));
    const id = fromLeastCoveredChapter(unseen.length ? unseen : available);
    return { id, reason: { type: state.misses.size ? "explore" : "warmup" } };
  }

  function fromLeastCoveredChapter(ids) {
    const askedPerChapter = new Map();
    state.history.forEach(h => {
      const chapter = graph.chapterOf(h.id);
      askedPerChapter.set(chapter, (askedPerChapter.get(chapter) || 0) + 1);
    });
    const coverage = id => askedPerChapter.get(graph.chapterOf(id)) || 0;
    const least = Math.min(...ids.map(coverage));
    return randomItem(ids.filter(id => coverage(id) === least));
  }

  function record(id, score) {
    state.history.push({ id, score });
    state.timesAsked.set(id, (state.timesAsked.get(id) || 0) + 1);
    if (isFullMarks(score)) recordRight(id);
    else recordMiss(id);
  }

  function recordMiss(id) {
    const position = state.history.length;
    state.misses.set(id, { strength: 1 });
    state.answeredRight.delete(id);
    if (!state.reasks.some(r => r.id === id)) state.reasks.push({ id, dueAt: position + REASK_AFTER, missedAt: position });
  }

  function recordRight(id) {
    state.answeredRight.add(id);
    state.misses.delete(id);
    state.reasks = state.reasks.filter(r => r.id !== id);
    state.misses.forEach((miss, missedId) => {
      if (graph.strength(missedId, id) < STRONG_LINK) return;
      miss.strength *= MISS_DECAY;
      if (miss.strength < MISS_DROP_BELOW) state.misses.delete(missedId);
    });
  }

  function weightedPick(candidates) {
    if (!candidates.length) return null;
    let roll = random() * candidates.reduce((sum, c) => sum + c.priority, 0);
    for (const c of candidates) {
      roll -= c.priority;
      if (roll <= 0) return c;
    }
    return candidates[0];
  }

  function randomItem(items) {
    return items[Math.floor(random() * items.length)];
  }

  function clearFocus() {
    state.focus = null;
  }

  return { state, next, record, clearFocus };
}
