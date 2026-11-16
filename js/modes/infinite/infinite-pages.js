/**
 * Infinite mode pages: the current question and the end-of-session summary.
 */

import { escapeHtml } from "../../core/text.js";
import { renderQuestion } from "../../ui/question-card.js";
import { formatDuration } from "../../ui/format.js";
import { sessionStats, weakConcepts } from "./session-stats.js";
import { describePick } from "./describe-pick.js";

export function renderInfiniteQuestion(app, session) {
  const { attempt, pick, number } = session.current;
  return `
    <p class="why-here">${escapeHtml(describePick(pick, session, app))}</p>
    ${renderQuestion(attempt, {
      number,
      key: `infinite-${number}`,
      controls: attempt.checked ? "" : `<div class="checkrow"><button type="button" class="btn" data-act="submit">Check</button></div>`,
      after: studyLinks(app, attempt.question)
    })}
    ${attempt.checked ? `<div class="qactions"><span class="spacer"></span><button type="button" class="btn primary" data-act="next">Next question</button></div>` : ""}`;
}

/** Links from a marked question to its concepts in Study mode. */
function studyLinks(app, question) {
  const links = question.concepts.map(c => `<button type="button" class="linkbtn" data-study="${c}">${escapeHtml(app.conceptById.get(c).name)}</button>`);
  return `<p class="seealso">Read up on this: ${links.join(", ")}</p>`;
}

export function renderInfiniteSummary(app, session) {
  const stats = sessionStats(session.engine.state);
  const weak = weakConcepts(session.engine.state, app.graph);
  return `
    <div class="page">
      <h2>Session summary</h2>
      <div class="tablewrap"><table class="generaltable">
        <tbody>
          <tr><th scope="row">Answered</th><td>${stats.answered}</td></tr>
          <tr><th scope="row">Fully right</th><td>${stats.fullyRight} (${stats.percentRight}%)</td></tr>
          <tr><th scope="row">Average mark</th><td>${stats.averageMark.toFixed(2)} out of 1.00</td></tr>
          <tr><th scope="row">Time taken</th><td>${formatDuration(session.endedAt - session.startedAt)}</td></tr>
          <tr><th scope="row">Still to revisit</th><td>${stats.toRevisit}</td></tr>
        </tbody>
      </table></div>
      <h3>Concepts you got wrong</h3>
      ${weak.length ? `<ul class="weak big">${weak.map(([c, count]) => missedConceptRow(app, c, count)).join("")}</ul>` : `<p class="muted">None this session.</p>`}
      <div class="qactions">
        <button type="button" class="btn primary" data-act="new">Start a new session</button>
        <button type="button" class="btn" data-study="">Open the concept map</button>
      </div>
    </div>`;
}

function missedConceptRow(app, conceptId, count) {
  const concept = app.conceptById.get(conceptId);
  return `<li><span>${escapeHtml(concept.name)}</span><span>${count} wrong</span>` +
    `<span class="weak-acts"><button type="button" class="btn" data-study="${conceptId}">Study</button><button type="button" class="btn" data-practise="${conceptId}">Practise</button></span></li>`;
}
