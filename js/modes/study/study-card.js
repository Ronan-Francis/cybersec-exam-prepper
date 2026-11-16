/**
 * A question shown in Study mode: prompt and choices, with the answer hidden behind "Reveal answer".
 */

import { formatInline } from "../../core/text.js";
import { markBand } from "../../core/attempt.js";
import { getQuestionType } from "../../question-types/index.js";
import { renderPrompt } from "../../ui/question-card.js";

const LAST_RESULT = { good: "Right last time", part: "Partly right last time", bad: "Wrong last time" };

export function renderStudyCard(app, question) {
  const type = getQuestionType(question.type);
  const lastScore = app.history.lastScore(question.id);
  const band = lastScore === null ? "" : markBand(lastScore);
  return `
    <article class="scard">
      <header><span class="tag type">${type.label}</span>${band ? `<span class="pill ${band}">${LAST_RESULT[band]}</span>` : ""}</header>
      ${renderPrompt(question)}
      ${type.renderPreview(question)}
      <details class="reveal"><summary>Reveal answer</summary>
        <div class="fb-right"><span class="fb-label">Answer</span>${type.renderCorrect(question)}</div>
        <div class="fb-explain"><span class="fb-label">Why</span><p>${formatInline(question.explanation)}</p></div>
      </details>
    </article>`;
}
