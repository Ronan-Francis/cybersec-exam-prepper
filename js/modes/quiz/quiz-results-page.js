/**
 * Results after finishing: Moodle's review summary table, marks by chapter and by question type,
 * then every question with its feedback.
 */

import { isFullMarks } from "../../core/attempt.js";
import { escapeHtml } from "../../core/text.js";
import { QUESTION_TYPES } from "../../question-types/index.js";
import { renderQuestion } from "../../ui/question-card.js";
import { formatDuration, formatDateTime } from "../../ui/format.js";

export function renderResultsPage(app, state) {
  const { attempts } = state;
  const marks = attempts.reduce((sum, a) => sum + a.score, 0);
  const percent = attempts.length ? (marks / attempts.length) * 100 : 0;
  const missed = attempts.filter(a => !isFullMarks(a.score)).length;
  return `
    <div class="page">
      <h2>Results</h2>
      <div class="tablewrap"><table class="generaltable">
        <tbody>
          <tr><th scope="row">Started on</th><td>${formatDateTime(state.startedAt)}</td></tr>
          <tr><th scope="row">State</th><td>Finished</td></tr>
          <tr><th scope="row">Time taken</th><td>${formatDuration(state.endedAt - state.startedAt)}</td></tr>
          <tr><th scope="row">Marks</th><td>${marks.toFixed(2)}/${attempts.length.toFixed(2)}</td></tr>
          <tr><th scope="row">Grade</th><td><strong>${percent.toFixed(2)}</strong> out of 100.00</td></tr>
        </tbody>
      </table></div>
      <div class="tablewrap"><table class="generaltable">
        <thead><tr><th scope="col">Chapter</th><th scope="col">Marks</th><th scope="col">Grade</th></tr></thead>
        <tbody>${app.chapters.map(c => breakdownRow(`${c.id}. ${escapeHtml(c.name)}`, attempts.filter(a => a.question.chapter === c.id))).join("")}</tbody>
      </table></div>
      <div class="tablewrap"><table class="generaltable">
        <thead><tr><th scope="col">Question type</th><th scope="col">Marks</th><th scope="col">Grade</th></tr></thead>
        <tbody>${QUESTION_TYPES.map(t => breakdownRow(t.label, attempts.filter(a => a.question.type === t.name))).join("")}</tbody>
      </table></div>
      <div class="qactions">
        ${missed ? `<button type="button" class="btn primary" data-act="retry">Retry the ${missed} I got wrong</button>` : ""}
        <button type="button" class="btn${missed ? "" : " primary"}" data-act="again">Start another quiz</button>
        <button type="button" class="btn" data-act="settings">Change settings</button>
      </div>
      ${reviewSection(state, missed)}
    </div>`;
}

/** One row of a breakdown table, or nothing if the attempt had no questions in that group. */
function breakdownRow(label, group) {
  if (!group.length) return "";
  const marks = group.reduce((sum, a) => sum + a.score, 0);
  return `<tr><td>${label}</td><td class="num">${marks.toFixed(2)}/${group.length.toFixed(2)}</td><td class="num">${Math.round((marks / group.length) * 100)}%</td></tr>`;
}

function reviewSection(state, missedCount) {
  const shown = state.attempts
    .map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt }) => state.reviewFilter === "all" || !isFullMarks(attempt.score));
  const questions = shown.map(({ attempt, index }) =>
    renderQuestion(attempt, { number: index + 1, key: `review-${index}`, current: false, id: `rv-${index}` }));
  return `
    <section class="review" aria-labelledby="revh">
      <div class="review-head">
        <h2 id="revh">Review</h2>
        <div class="review-filter" role="group" aria-label="Filter review">
          <button type="button" class="linkbtn" data-filter="all" aria-pressed="${state.reviewFilter === "all"}">All ${state.attempts.length} questions</button>
          <button type="button" class="linkbtn" data-filter="wrong" aria-pressed="${state.reviewFilter === "wrong"}">Only the ${missedCount} I got wrong</button>
        </div>
      </div>
      ${questions.length ? questions.join("") : `<p class="muted">You got everything right, so there's nothing to show.</p>`}
    </section>`;
}
