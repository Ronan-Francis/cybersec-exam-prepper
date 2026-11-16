/**
 * The feedback box shown under a question once it is marked, worded the way Moodle words it:
 * the verdict, what the user got wrong (option by option), the correct answer, and why it's right.
 * The mark itself is shown in the question's info box.
 */

import { formatInline } from "../core/text.js";
import { markBand } from "../core/attempt.js";
import { getQuestionType } from "../question-types/index.js";

const VERDICTS = { good: "Your answer is correct.", part: "Your answer is partially correct.", bad: "Your answer is incorrect." };

export function renderFeedback(attempt) {
  const band = markBand(attempt.score);
  const type = getQuestionType(attempt.question.type);
  const fullyRight = band === "good";
  return `<div class="outcome" role="status">
    <p>${VERDICTS[band]}</p>
    ${fullyRight ? "" : renderMistakes(type.listMistakes(attempt))}
    ${fullyRight ? "" : `<div><p>The correct answer is:</p>${type.renderCorrect(attempt.question)}</div>`}
    <p>${formatInline(attempt.question.explanation)}</p>
  </div>`;
}

function renderMistakes(mistakes) {
  if (!mistakes.length) return "";
  return mistakes.length === 1 ? `<p>${mistakes[0]}</p>` : `<ul>${mistakes.map(m => `<li>${m}</li>`).join("")}</ul>`;
}
