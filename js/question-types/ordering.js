/**
 * Ordering: put the steps in the right sequence with up and down buttons.
 *
 * Data: steps: [first, second, ...] in the correct order.
 * Response: array of step indexes in the user's order.
 * Marking is Moodle's "relative to the next item": each adjacent pair in the right sequence earns credit.
 */

import { formatInline, shuffle, seededShuffle } from "../core/text.js";
import { markIcon, hint } from "./shared.js";

export const ordering = {
  name: "ordering",
  label: "Ordering",

  prepare() {
    return {};
  },

  /** A shuffled order that is never already correct. */
  emptyResponse(question, view, random = Math.random) {
    const identity = question.steps.map((_, i) => i);
    if (identity.length < 2) return identity;
    let order;
    do order = shuffle(identity, random); while (order.every((step, i) => step === i));
    return order;
  },

  isAnswered(attempt) {
    return attempt.touched;
  },

  grade(question, response) {
    if (response.length < 2) return 1;
    let inSequence = 0;
    for (let i = 0; i < response.length - 1; i++) if (response[i + 1] === response[i] + 1) inSequence++;
    return inSequence / (response.length - 1);
  },

  renderInput(attempt, { locked, reveal }) {
    const { question, response } = attempt;
    const rows = response.map((step, position) => {
      const band = reveal ? (step === position ? "good" : "bad") : "";
      const controls = locked
        ? (reveal ? markIcon(band) : "")
        : `<span class="omoves">` +
          `<button type="button" class="mv" data-move="-1" data-pos="${position}" aria-label="Move up"${position === 0 ? " disabled" : ""}>▲</button>` +
          `<button type="button" class="mv" data-move="1" data-pos="${position}" aria-label="Move down"${position === response.length - 1 ? " disabled" : ""}>▼</button>` +
          `</span>`;
      return `<li class="oitem ${band}"><span class="opos">${position + 1}</span><span class="otext">${formatInline(question.steps[step])}</span>${controls}</li>`;
    });
    return hint(locked ? "Your order:" : "Use the arrows to put the items in order. First item at the top.") + `<ol class="order">${rows.join("")}</ol>`;
  },

  /** Handles the up and down buttons. Returns the new position, or null if the click wasn't a move. */
  handleClick(attempt, button) {
    if (button.dataset.move === undefined) return null;
    const from = Number(button.dataset.pos);
    const to = from + Number(button.dataset.move);
    if (to < 0 || to >= attempt.response.length) return null;
    const order = attempt.response;
    [order[from], order[to]] = [order[to], order[from]];
    attempt.touched = true;
    return to;
  },

  renderCorrect(question) {
    return `<ol>${question.steps.map(s => `<li>${formatInline(s)}</li>`).join("")}</ol>`;
  },

  listMistakes({ question, response }) {
    return response.flatMap((step, position) =>
      step === position ? [] : [`<em>${formatInline(question.steps[step])}</em> is step ${step + 1}, not step ${position + 1}.`]);
  },

  renderPreview(question) {
    const items = seededShuffle(question.steps, question.id).map(s => `<li>${formatInline(s)}</li>`).join("");
    return hint("Put these in order:") + `<ul class="pv-list">${items}</ul>`;
  }
};
