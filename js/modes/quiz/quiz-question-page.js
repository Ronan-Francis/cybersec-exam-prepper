/**
 * The current question in a quiz attempt, with Previous / Check / Next buttons.
 */

import { renderTags, renderPrompt, renderAnswerArea, renderKeyHints } from "../../ui/question-card.js";
import { renderFeedback } from "../../ui/feedback.js";

export function renderQuestionPage(app, state) {
  const attempt = state.attempts[state.index];
  const isLast = state.index === state.attempts.length - 1;
  const practice = state.style === "practice";
  const canCheck = practice && !attempt.checked;
  return `
    <article class="qcard" aria-labelledby="qtext">
      <header class="qhead">
        <div class="qnum"><span>Question</span> <strong>${state.index + 1}</strong> <span class="of">of ${state.attempts.length}</span></div>
        <div class="tags">${renderTags(attempt.question, app.chapterById)}</div>
        <button type="button" class="flagbtn${attempt.flagged ? " on" : ""}" data-act="flag" aria-pressed="${attempt.flagged}">${attempt.flagged ? "Remove flag" : "Flag question"}</button>
      </header>
      ${renderPrompt(attempt.question, { withId: true })}
      ${renderAnswerArea(attempt, { key: `quiz-${state.index}` })}
      ${attempt.checked ? renderFeedback(attempt) : ""}
      <footer class="qactions">
        <button type="button" class="btn ghost" data-act="prev"${state.index === 0 ? " disabled" : ""}>Previous page</button>
        <span class="spacer"></span>
        ${canCheck ? `<button type="button" class="btn" data-act="check">Check</button>` : ""}
        <button type="button" class="btn ${canCheck ? "ghost" : "primary"}" data-act="next">${isLast ? "Finish attempt…" : "Next page"}</button>
      </footer>
    </article>
    ${renderKeyHints(practice ? "check, then next" : "next", { flag: true })}`;
}
