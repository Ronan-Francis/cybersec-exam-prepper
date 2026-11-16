/**
 * A question shown in Study mode: prompt and choices, with the answer hidden behind "Show answer".
 */

import { formatInline } from "../../core/text.js";
import { markBand } from "../../core/attempt.js";
import { getQuestionType } from "../../question-types/index.js";
import { renderPrompt } from "../../ui/question-card.js";

const LAST_RESULT = { good: "right last time", part: "partly right last time", bad: "wrong last time" };

export function renderStudyCard(app, question) {
  const type = getQuestionType(question.type);
  const lastScore = app.history.lastScore(question.id);
  const band = lastScore === null ? "" : markBand(lastScore);
  return `
    <article class="scard">
      <p class="small muted">${type.label}${band ? `, <span class="${band}-text">${LAST_RESULT[band]}</span>` : ""}</p>
      ${renderPrompt(question)}
      ${type.renderPreview(question)}
      <details class="reveal"><summary>Show answer</summary>
        <div class="outcome">${type.renderCorrect(question)}<p>${formatInline(question.explanation)}</p></div>
      </details>
    </article>`;
}
