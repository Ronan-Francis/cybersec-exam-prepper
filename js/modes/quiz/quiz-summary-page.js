/**
 * Moodle's "Summary of attempt" page, shown before submitting.
 */

import { isAnswered, markBand, bandWord } from "../../core/attempt.js";
import { plural } from "../../core/text.js";

export function renderSummaryPage(state) {
  const unanswered = state.attempts.filter(a => !a.checked && !isAnswered(a)).length;
  const rows = state.attempts.map((attempt, i) => {
    const pending = !attempt.checked && !isAnswered(attempt);
    const status = attempt.checked ? `Checked: ${bandWord(markBand(attempt.score))}` : pending ? "Not yet answered" : "Answer saved";
    return `<tr class="${pending ? "todo" : ""}">` +
      `<td><button type="button" class="linkbtn" data-goto="${i}">${i + 1}${attempt.flagged ? " (flagged)" : ""}</button></td>` +
      `<td>${status}</td></tr>`;
  });
  const note = unanswered
    ? `${plural(unanswered, "question")} still ${unanswered === 1 ? "has" : "have"} no answer and will be marked incorrect.`
    : "Every question has an answer.";
  return `
    <div class="page">
      <h2>Summary of attempt</h2>
      <div class="tablewrap"><table class="generaltable sumtable">
        <thead><tr><th scope="col">Question</th><th scope="col">Status</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table></div>
      <p>${note}</p>
      <div class="qactions">
        <button type="button" class="btn" data-act="return">Return to attempt</button>
        <span class="spacer"></span>
        <button type="button" class="btn primary" data-act="submit">Submit all and finish</button>
      </div>
    </div>`;
}
