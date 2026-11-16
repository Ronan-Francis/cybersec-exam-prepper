/**
 * Connects the answer controls to whichever attempt is current, for any question type.
 * Each type reads its own inputs (readInput) and buttons (handleClick), so nothing here switches on type.
 */

import { getQuestionType } from "../question-types/index.js";
import { $, $$ } from "./dom.js";

/**
 * Listens for changes inside root. Pass an AbortSignal to remove the listeners when a mode is left.
 *   getAttempt()        the attempt being answered, or null
 *   onAnswerChange()    called after the response changes (for example to update the navigation grid)
 *   onRerender()        called when a change needs the answer area redrawn (ordering moves)
 */
export function bindAnswerInputs({ root, getAttempt, onAnswerChange = () => {}, onRerender, signal }) {
  const readChangedInput = event => {
    const attempt = getAttempt();
    const input = event.target;
    if (!attempt || attempt.checked || !input.closest("#answer")) return;
    if (!getQuestionType(attempt.question.type).readInput?.(attempt, input)) return;
    syncSelectedOptions(root);
    onAnswerChange(attempt);
  };
  root.addEventListener("change", readChangedInput, { signal });
  root.addEventListener("input", readChangedInput, { signal });

  root.addEventListener("click", event => {
    const button = event.target.closest("#answer button");
    const attempt = getAttempt();
    if (!button || !attempt || attempt.checked) return;
    const type = getQuestionType(attempt.question.type);
    const movedTo = type.handleClick ? type.handleClick(attempt, button) : null;
    if (movedTo === null) return;
    onRerender();
    refocusMoveButton(root, movedTo, button.dataset.move);
    onAnswerChange(attempt);
  }, { signal });
}

/**
 * Keyboard shortcuts while answering: 1 to 9 choose an option, Enter runs onEnter, F runs onFlag if given.
 * Keys typed into text fields, dropdowns or forms (such as the setup panel) are left alone.
 */
export function bindAnswerKeys({ getAttempt, onEnter, onFlag = null, signal }) {
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const attempt = getAttempt();
    if (!attempt) return;
    const target = event.target;
    const tag = (target.tagName || "").toLowerCase();
    const inForm = !!(target.closest && target.closest("form"));
    const typing = (tag === "input" && target.type === "text") || tag === "select" || tag === "textarea";

    if (event.key === "Enter") {
      if (inForm || ["button", "select", "summary", "a"].includes(tag)) return;
      if (tag === "input" && !target.closest("#answer")) return;
      event.preventDefault();
      onEnter(attempt);
      return;
    }
    if (typing || inForm) return;
    if ((event.key === "f" || event.key === "F") && onFlag) { onFlag(attempt); return; }
    if (/^[1-9]$/.test(event.key) && !attempt.checked) {
      const choices = $$("#answer input[type=radio], #answer input[type=checkbox]");
      choices[Number(event.key) - 1]?.click();
    }
  }, { signal });
}

function syncSelectedOptions(root) {
  $$(".opt", root).forEach(label => label.classList.toggle("is-selected", label.querySelector("input").checked));
}

/** After an ordering move, keep keyboard focus on the item that moved. */
function refocusMoveButton(root, position, direction) {
  const button = $(`.mv[data-pos="${position}"][data-move="${direction}"]:not([disabled])`, root) || $(`.mv[data-pos="${position}"]:not([disabled])`, root);
  button?.focus();
}
