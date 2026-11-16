/**
 * Moodle's "Summary of attempt" page, shown before submitting.
 */

import { isAnswered, markBand, bandWord } from "../../core/attempt.js";
import { escapeHtml, plural } from "../../core/text.js";

export function renderSummaryPage(app, state) {
  const unanswered = state.attempts.filter(a => !a.checked && !isAnswered(a)).length;
  const rows = state.attempts.map((attempt, i) => {
    const pending = !attempt.checked && !isAnswered(attempt);
    const status = attempt.checked ? `Checked: ${bandWord(markBand(attempt.score))}` : pending ? "Not yet answered" : "Answer saved";
    const chapter = app.chapterById.get(attempt.question.chapter).short;
    return `<tr class="${pending ? "todo" : ""}">` +
      `<td><button type="button" class="linkbtn" data-goto="${i}">${i + 1}${attempt.flagged ? " ⚑" : ""}</button></td>` +
      `<td>${escapeHtml(chapter)}</td><td>${status}</td></tr>`;
  });
  const note = unanswered
    ? `You have <strong>${plural(unanswered, "unanswered question")}</strong>. They will be marked as incorrect.`
    : "All questions have an answer.";
  return `
    <article class="qcard summary">
      <h2>Summary of attempt</h2>
      <div class="tablewrap"><table class="sumtable">
        <thead><tr><th scope="col">Question</th><th scope="col">Chapter</th><th scope="col">Status</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table></div>
      <p class="confirm-note">${note}</p>
      <footer class="qactions">
        <button type="button" class="btn ghost" data-act="return">Return to attempt</button>
        <span class="spacer"></span>
        <button type="button" class="btn primary" data-act="submit">Submit all and finish</button>
      </footer>
    </article>`;
}
