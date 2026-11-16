/**
 * The feedback block shown after an answer is marked:
 * verdict and mark, what the user got wrong (option by option), the correct answer, and why it's right.
 */

import { formatInline } from "../core/text.js";
import { markBand } from "../core/attempt.js";
import { getQuestionType } from "../question-types/index.js";

const VERDICTS = { good: "Correct", part: "Partially correct", bad: "Incorrect" };

export function renderFeedback(attempt) {
  const band = markBand(attempt.score);
  const type = getQuestionType(attempt.question.type);
  const fullyRight = band === "good";
  return `<div class="feedback ${band}" role="status">
    <div class="fb-head"><span class="pill ${band}">${VERDICTS[band]}</span><span class="marks">Mark ${attempt.score.toFixed(2)} out of 1.00</span></div>
    ${fullyRight ? "" : renderMistakes(type.listMistakes(attempt), band)}
    <div class="fb-right"><span class="fb-label">${fullyRight ? "Your answer" : "The correct answer is"}</span>${type.renderCorrect(attempt.question)}</div>
    <div class="fb-explain"><span class="fb-label">${fullyRight ? "Why it's right" : "Why the correct answer is right"}</span><p>${formatInline(attempt.question.explanation)}</p></div>
  </div>`;
}

function renderMistakes(mistakes, band) {
  if (!mistakes.length) return "";
  const label = band === "part" ? "What you got wrong" : "Why your answer was wrong";
  const body = mistakes.length === 1 ? `<p>${mistakes[0]}</p>` : `<ul>${mistakes.map(m => `<li>${m}</li>`).join("")}</ul>`;
  return `<div class="fb-yours"><span class="fb-label">${label}</span>${body}</div>`;
}
