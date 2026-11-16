/**
 * Results after finishing: grade, breakdown by chapter and question type, and a full review.
 */

import { isFullMarks } from "../../core/attempt.js";
import { escapeHtml, pad2 } from "../../core/text.js";
import { QUESTION_TYPES } from "../../question-types/index.js";
import { renderTags, renderPrompt, renderAnswerArea } from "../../ui/question-card.js";
import { renderFeedback } from "../../ui/feedback.js";
import { formatDuration, formatDateTime } from "../../ui/format.js";

const band = percent => (percent >= 70 ? "good" : percent >= 40 ? "part" : "bad");

export function renderResultsPage(app, state) {
  const { attempts } = state;
  const marks = attempts.reduce((sum, a) => sum + a.score, 0);
  const percent = attempts.length ? (marks / attempts.length) * 100 : 0;
  const notFullyRight = attempts.filter(a => !isFullMarks(a.score));
  return `
    <article class="qcard results">
      <div class="res-top">
        <div class="grade ${band(percent)}"><span class="grade-num">${percent.toFixed(1)}</span><span class="grade-of">out of 100</span></div>
        <div class="tablewrap"><table class="reviewtable">
          <tr><th scope="row">State</th><td>Finished</td></tr>
          <tr><th scope="row">Mode</th><td>${state.style === "exam" ? "Exam (marked at the end)" : "Practice (checked as you go)"}</td></tr>
          <tr><th scope="row">Started on</th><td>${formatDateTime(state.startedAt)}</td></tr>
          <tr><th scope="row">Time taken</th><td>${formatDuration(state.endedAt - state.startedAt)}</td></tr>
          <tr><th scope="row">Marks</th><td>${marks.toFixed(2)}/${attempts.length.toFixed(2)}</td></tr>
        </table></div>
      </div>
      <h3>By chapter</h3>
      <div class="bars">${chapterBars(app, attempts)}</div>
      <h3>By question type</h3>
      <div class="typechips">${typeChips(attempts)}</div>
      <div class="res-actions">
        ${notFullyRight.length ? `<button type="button" class="btn primary" data-act="retry">Retry the ${notFullyRight.length} I didn't get fully right</button>` : `<span class="pill good">Full marks</span>`}
        <button type="button" class="btn" data-act="again">New quiz, same settings</button>
        <button type="button" class="btn ghost" data-act="settings">Change settings</button>
      </div>
    </article>
    ${reviewSection(app, state, notFullyRight.length)}`;
}

function chapterBars(app, attempts) {
  return app.chapters.map(chapter => {
    const inChapter = attempts.filter(a => a.question.chapter === chapter.id);
    if (!inChapter.length) return "";
    const marks = inChapter.reduce((sum, a) => sum + a.score, 0);
    const percent = (marks / inChapter.length) * 100;
    return `<div class="bar-row"><span class="bar-label">${pad2(chapter.id)} ${escapeHtml(chapter.short)}</span>` +
      `<span class="bar-track"><span class="bar-fill ${band(percent)}" style="width:${percent.toFixed(1)}%"></span></span>` +
      `<span class="bar-val">${marks.toFixed(1)}/${inChapter.length}</span></div>`;
  }).join("");
}

function typeChips(attempts) {
  return QUESTION_TYPES.map(type => {
    const ofType = attempts.filter(a => a.question.type === type.name);
    if (!ofType.length) return "";
    const percent = Math.round((ofType.reduce((sum, a) => sum + a.score, 0) / ofType.length) * 100);
    return `<span class="tchip"><span>${type.label}</span><strong>${percent}%</strong></span>`;
  }).join("");
}

function reviewSection(app, state, notFullyRightCount) {
  const shown = state.attempts
    .map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt }) => state.reviewFilter === "all" || !isFullMarks(attempt.score));
  const cards = shown.map(({ attempt, index }) => `
    <article class="qcard rv" id="rv-${index}">
      <header class="qhead">
        <div class="qnum"><span>Question</span> <strong>${index + 1}</strong></div>
        <div class="tags">${renderTags(attempt.question, app.chapterById)}</div>
      </header>
      ${renderPrompt(attempt.question)}
      ${renderAnswerArea(attempt, { key: `review-${index}`, current: false })}
      ${renderFeedback(attempt)}
    </article>`);
  return `
    <section class="review" aria-labelledby="revh">
      <div class="review-head">
        <h2 id="revh">Review</h2>
        <div class="seg small" role="group" aria-label="Filter review">
          <button type="button" data-filter="all" aria-pressed="${state.reviewFilter === "all"}">All ${state.attempts.length}</button>
          <button type="button" data-filter="wrong" aria-pressed="${state.reviewFilter === "wrong"}">Not fully correct ${notFullyRightCount}</button>
        </div>
      </div>
      ${cards.length ? cards.join("") : `<p class="muted">Nothing to show here.</p>`}
    </section>`;
}
