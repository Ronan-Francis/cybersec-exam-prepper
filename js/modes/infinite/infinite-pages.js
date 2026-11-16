/**
 * Infinite mode pages: the current question and the end-of-session summary.
 */

import { escapeHtml, pad2 } from "../../core/text.js";
import { renderTags, renderPrompt, renderAnswerArea, renderKeyHints } from "../../ui/question-card.js";
import { renderFeedback } from "../../ui/feedback.js";
import { formatDuration } from "../../ui/format.js";
import { sessionStats, weakConcepts } from "./session-stats.js";
import { describePick } from "./describe-pick.js";

export function renderInfiniteQuestion(app, session) {
  const { attempt, number } = session.current;
  const question = attempt.question;
  return `
    <article class="qcard" aria-labelledby="qtext">
      <header class="qhead">
        <div class="qnum"><span>Infinite</span> <strong>${number}</strong></div>
        <div class="tags">${renderTags(question, app.chapterById)}</div>
      </header>
      <p class="why-here">${escapeHtml(describePick(session.current.pick, session, app))}</p>
      ${renderPrompt(question, { withId: true })}
      ${renderAnswerArea(attempt, { key: `infinite-${number}` })}
      ${attempt.checked ? renderFeedback(attempt) + conceptChips(app, question) : ""}
      <footer class="qactions">
        <button type="button" class="btn ghost" data-act="end">End session</button>
        <span class="spacer"></span>
        ${attempt.checked
          ? `<button type="button" class="btn primary" data-act="next">Next question</button>`
          : `<button type="button" class="btn primary" data-act="submit">Submit</button>`}
      </footer>
    </article>
    ${renderKeyHints("submit, then next question")}`;
}

function conceptChips(app, question) {
  const chips = question.concepts.map(c => `<button type="button" class="cchip" data-study="${c}">${escapeHtml(app.conceptById.get(c).name)}</button>`);
  return `<div class="cchips"><span class="fb-label">Concepts in this question</span>${chips.join("")}</div>`;
}

export function renderInfiniteSummary(app, session) {
  const stats = sessionStats(session.engine.state);
  const weak = weakConcepts(session.engine.state, app.graph);
  return `
    <article class="qcard results">
      <h2>Session summary</h2>
      <div class="tablewrap"><table class="reviewtable">
        <tr><th scope="row">Answered</th><td>${stats.answered}</td></tr>
        <tr><th scope="row">Fully right</th><td>${stats.fullyRight} (${stats.percentRight}%)</td></tr>
        <tr><th scope="row">Average mark</th><td>${stats.averageMark.toFixed(2)} out of 1.00</td></tr>
        <tr><th scope="row">Time</th><td>${formatDuration(session.endedAt - session.startedAt)}</td></tr>
        <tr><th scope="row">Still to revisit</th><td>${stats.toRevisit}</td></tr>
      </table></div>
      <h3>Concepts you missed</h3>
      ${weak.length ? `<ul class="weak big">${weak.map(([c, count]) => missedConceptRow(app, c, count)).join("")}</ul>` : `<p class="muted">You didn't miss anything this session.</p>`}
      <div class="res-actions">
        <button type="button" class="btn primary" data-act="new">Start a new session</button>
        <button type="button" class="btn" data-study="">Open Study mode</button>
      </div>
    </article>`;
}

function missedConceptRow(app, conceptId, count) {
  const concept = app.conceptById.get(conceptId);
  return `<li><span><strong>${escapeHtml(concept.name)}</strong> <span class="muted small">Ch ${pad2(concept.chapter)}</span></span>` +
    `<span class="muted small">${count} missed</span>` +
    `<span class="weak-acts"><button type="button" class="btn ghost" data-study="${conceptId}">Study</button><button type="button" class="btn ghost" data-practise="${conceptId}">Practise</button></span></li>`;
}
