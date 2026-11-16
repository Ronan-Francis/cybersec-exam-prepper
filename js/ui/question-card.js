/**
 * A question laid out the way Moodle lays one out: an info box (number, state, mark) beside the question,
 * with the feedback underneath once it has been marked. Shared by every mode.
 */

import { escapeHtml, formatInline } from "../core/text.js";
import { isAnswered, markBand } from "../core/attempt.js";
import { getQuestionType } from "../question-types/index.js";
import { renderFeedback } from "./feedback.js";

const STATES = { good: "Correct", part: "Partially correct", bad: "Incorrect" };

/**
 * One whole question.
 *   number    the question's number in this attempt or session
 *   key       unique on the page; it names radio groups and input ids
 *   current   false for review copies, so only the question being answered gets the ids
 *   flag      show the "Flag question" button
 *   controls  HTML placed under the answer, such as the Check button
 *   after     HTML placed under the feedback once the question is marked
 */
export function renderQuestion(attempt, { number, key, current = true, flag = false, controls = "", after = "", id = "" }) {
  return `
    <article class="que"${id ? ` id="${id}"` : ""}${current ? ' aria-labelledby="qtext"' : ""}>
      ${renderInfo(attempt, { number, flag })}
      <div class="content">
        <div class="formulation">
          ${renderPrompt(attempt.question, { withId: current })}
          ${renderAnswerArea(attempt, { key, current })}
          ${controls}
        </div>
        ${attempt.checked ? renderFeedback(attempt) + after : ""}
      </div>
    </article>`;
}

/** The box beside a question: its number, whether it has been answered or how it was marked, and the flag. */
export function renderInfo(attempt, { number, flag = false }) {
  const state = attempt.checked ? STATES[markBand(attempt.score)] : isAnswered(attempt) ? "Answer saved" : "Not yet answered";
  const mark = attempt.checked ? `Mark ${attempt.score.toFixed(2)} out of 1.00` : "Marked out of 1.00";
  const flagButton = flag
    ? `<button type="button" class="linkbtn flagbtn${attempt.flagged ? " on" : ""}" data-act="flag" aria-pressed="${attempt.flagged}">${attempt.flagged ? "Remove flag" : "Flag question"}</button>`
    : "";
  return `<div class="info"><h3 class="no">Question <span>${number}</span></h3><p>${state}</p><p>${mark}</p>${flagButton}</div>`;
}

/** Redraws the info box of the question being answered, for example when "Not yet answered" becomes "Answer saved". */
export function updateInfo(root, attempt, options) {
  const info = root.querySelector(".que .info");
  if (info) info.outerHTML = renderInfo(attempt, options);
}

/** The prompt, followed by its code block if it has one. Only the current question gets the id. */
export function renderPrompt(question, { withId = false } = {}) {
  return `<div class="qtext"${withId ? ' id="qtext"' : ""}>${formatInline(question.prompt)}</div>${renderCode(question)}`;
}

export function renderCode(question) {
  if (!question.code) return "";
  return `<div class="codewrap"><pre class="codeblock"><code>${escapeHtml(question.code)}</code></pre></div>`;
}

/** The answer controls. Once an attempt is checked they are locked and show right and wrong marks. */
export function renderAnswerArea(attempt, { key, current = true }) {
  const controls = getQuestionType(attempt.question.type).renderInput(attempt, { locked: attempt.checked, reveal: attempt.checked, key });
  return `<div class="answer"${current ? ' id="answer"' : ""}>${controls}</div>`;
}
