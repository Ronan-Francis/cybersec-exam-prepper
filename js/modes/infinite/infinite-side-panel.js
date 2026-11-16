/**
 * The Infinite session block: totals, the concept being practised, recent answers and the concepts missed.
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
    <h2>This session</h2>
    <dl class="inf-stats">
      <dt>Answered</dt><dd>${stats.answered}</dd>
      <dt>Fully right</dt><dd>${stats.answered ? `${stats.percentRight}%` : "0"}</dd>
      <dt>To revisit</dt><dd>${stats.toRevisit}</dd>
      <dt>Time taken</dt><dd id="infiniteTimer">${formatStopwatch((session.endedAt || Date.now()) - session.startedAt)}</dd>
    </dl>
    ${focus ? `<p>Practising <strong>${escapeHtml(app.conceptById.get(focus).name)}</strong>. <button type="button" class="linkbtn" data-act="clear-focus">Go back to everything</button></p>` : ""}
    ${engineState.history.length ? `<div><h3>Recent answers</h3><div class="strip">${recentDots(engineState.history)}</div></div>` : ""}
    ${weak.length ? `<div><h3>Concepts you've got wrong</h3>${weakSpotList(app, weak)}</div>` : ""}
    <div class="inf-actions">
      ${session.endedAt ? "" : `<button type="button" class="linkbtn" data-act="end">End session</button>`}
      <button type="button" class="linkbtn" data-act="new">Start a new session</button>
    </div>`;
}

function recentDots(history) {
  return history.slice(-RECENT_DOTS).map(h => {
    const result = isFullMarks(h.score) ? "right" : h.score > 0 ? "partly right" : "wrong";
    return `<span class="dot ${markBand(h.score)}" title="${escapeHtml(h.id)}: ${result}"></span>`;
  }).join("");
}

function weakSpotList(app, weak) {
  const items = weak.slice(0, WEAK_SPOTS_SHOWN).map(([conceptId, count]) =>
    `<li><button type="button" class="linkbtn" data-study="${conceptId}">${escapeHtml(app.conceptById.get(conceptId).name)}</button><span>${count} wrong</span></li>`);
  return `<ul class="weak">${items.join("")}</ul>`;
}
