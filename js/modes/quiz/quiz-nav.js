/**
 * The Moodle-style "Quiz navigation" block: one numbered button per question and the Finish link.
 */

import { isAnswered, markBand, bandWord } from "../../core/attempt.js";
import { $ } from "../../ui/dom.js";

export function renderQuizNav(state) {
  const finished = state.page === "results";
  $("#navgrid").innerHTML = state.attempts.map((attempt, i) => navButton(attempt, i, state, finished)).join("");
  $("#finishBtn").hidden = finished;
}

function navButton(attempt, index, state, finished) {
  const current = index === state.index && state.page === "question";
  const classes = ["nb"];
  let progress = "";
  if (attempt.checked) { classes.push(markBand(attempt.score)); progress = `, ${bandWord(markBand(attempt.score))}`; }
  else if (isAnswered(attempt)) { classes.push("answered"); progress = ", answered"; }
  if (current) classes.push("current");
  if (attempt.flagged) classes.push("flagged");
  const label = `Question ${index + 1}${attempt.flagged ? ", flagged" : ""}${progress}`;
  // Before finishing, a button opens that question; afterwards it jumps to that question in the review.
  const action = finished ? `data-review="${index}"` : `data-goto="${index}"`;
  return `<button type="button" class="${classes.join(" ")}" ${action} aria-label="${label}"${current ? ' aria-current="true"' : ""}>${index + 1}</button>`;
}
