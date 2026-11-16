/**
 * The current question in a quiz attempt. In practice mode it has a Check button under the answer;
 * the Previous and Next buttons sit below the question.
 */

import { renderQuestion } from "../../ui/question-card.js";

export function renderQuestionPage(state) {
  const attempt = state.attempts[state.index];
  const isLast = state.index === state.attempts.length - 1;
  const canCheck = state.style === "practice" && !attempt.checked;
  return `
    ${renderQuestion(attempt, {
      number: state.index + 1,
      key: `quiz-${state.index}`,
      flag: true,
      controls: canCheck ? `<div class="checkrow"><button type="button" class="btn" data-act="check">Check</button></div>` : ""
    })}
    <div class="qactions">
      ${state.index === 0 ? "" : `<button type="button" class="btn" data-act="prev">Previous page</button>`}
      <span class="spacer"></span>
      <button type="button" class="btn primary" data-act="next">${isLast ? "Finish attempt…" : "Next page"}</button>
    </div>`;
}
