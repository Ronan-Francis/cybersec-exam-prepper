/**
 * The Moodle-style question navigation in the side panel: numbered grid, progress line and Finish button.
 */

import { isAnswered, markBand, bandWord } from "../../core/attempt.js";
import { plural } from "../../core/text.js";
import { $ } from "../../ui/dom.js";

export function renderQuizNav(state) {
  const finished = state.page === "results";
  const grid = $("#navgrid");
  grid.innerHTML = state.attempts.map((attempt, i) => navButton(attempt, i, state, finished)).join("");

  const answered = state.attempts.filter(a => a.checked || isAnswered(a)).length;
  $("#navmeta").textContent = finished ? `${plural(state.attempts.length, "question")} marked` : `${answered} of ${state.attempts.length} answered`;
  $("#finishBtn").hidden = finished;
  $("#modeTag").textContent = state.style === "exam" ? "Exam mode" : "Practice mode";
  keepCurrentVisible(grid);
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
  // Before finishing, a button opens that question; afterwards it jumps to its review card.
  const action = finished ? `data-review="${index}"` : `data-goto="${index}"`;
  return `<button type="button" class="${classes.join(" ")}" ${action} aria-label="${label}"${current ? ' aria-current="true"' : ""}>${index + 1}</button>`;
}

/** On narrow screens the grid is a horizontal strip; keep the current question in view. */
function keepCurrentVisible(grid) {
  const current = $(".nb.current", grid);
  if (current && grid.scrollWidth > grid.clientWidth) {
    grid.scrollLeft = current.offsetLeft - grid.offsetLeft - grid.clientWidth / 2 + current.offsetWidth / 2;
  }
}
