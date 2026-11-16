/**
 * The Infinite session panel: stats, focus, recent answers and weak spots.
 */

import { escapeHtml } from "../../core/text.js";
import { markBand, isFullMarks } from "../../core/attempt.js";
import { formatStopwatch } from "../../ui/format.js";
import { sessionStats, weakConcepts } from "./session-stats.js";

const RECENT_DOTS = 40;
const WEAK_SPOTS_SHOWN = 6;

export function renderInfiniteSidePanel(app, session) {
  const engineState = session.engine.state;
  const stats = sessionStats(engineState);
  const weak = weakConcepts(engineState, app.graph);
  const focus = engineState.focus;
  return `
    <div class="nav-head"><h2>Infinite session</h2><span class="timer" id="infiniteTimer">${formatStopwatch((session.endedAt || Date.now()) - session.startedAt)}</span></div>
    <dl class="inf-stats">
      <div><dt>Answered</dt><dd>${stats.answered}</dd></div>
      <div><dt>Fully right</dt><dd>${stats.answered ? `${stats.percentRight}%` : "0"}</dd></div>
      <div><dt>Streak</dt><dd>${stats.streak}</dd></div>
      <div><dt>To revisit</dt><dd>${stats.toRevisit}</dd></div>
    </dl>
    ${focus ? `<p class="focusline">Focus: <strong>${escapeHtml(app.conceptById.get(focus).name)}</strong> <button type="button" class="tiny" data-act="clear-focus">Clear focus</button></p>` : ""}
    <h3 class="side-h">Recent answers</h3>
    <div class="strip">${recentDots(engineState.history)}</div>
    <h3 class="side-h">Weak spots this session</h3>
    ${weakSpotList(app, weak)}
    <div class="inf-actions">
      ${session.endedAt ? "" : `<button type="button" class="btn ghost block" data-act="end">End session</button>`}
      <button type="button" class="btn ghost block" data-act="new">Start a new session</button>
    </div>`;
}

function recentDots(history) {
  if (!history.length) return `<span class="muted small">Nothing yet.</span>`;
  return history.slice(-RECENT_DOTS).map(h => {
    const result = isFullMarks(h.score) ? "right" : h.score > 0 ? "partly right" : "wrong";
    return `<span class="dot ${markBand(h.score)}" title="${escapeHtml(h.id)}: ${result}"></span>`;
  }).join("");
}

function weakSpotList(app, weak) {
  if (!weak.length) return `<p class="muted small">None yet. Concepts you miss will show up here.</p>`;
  const items = weak.slice(0, WEAK_SPOTS_SHOWN).map(([conceptId, count]) =>
    `<li><button type="button" class="linkbtn" data-study="${conceptId}">${escapeHtml(app.conceptById.get(conceptId).name)}</button><span>${count} missed</span></li>`);
  return `<ul class="weak">${items.join("")}</ul>`;
}
