/**
 * Rendering helpers shared by the question types.
 */

import { escapeHtml } from "../core/text.js";

const LETTERS = "abcdefghij";

/** A tick or cross shown next to marked answers. kind is "good", "part" or "bad". */
export function markIcon(kind, label) {
  const symbol = kind === "bad" ? "✗" : "✓";
  return `<span class="mk ${kind}"${label ? ` aria-label="${escapeHtml(label)}"` : ' aria-hidden="true"'}>${symbol}</span>`;
}

/**
 * A list of radio buttons or checkboxes.
 * Each choice: { value, html, selected, mark } where mark is "correct", "wrong", "missed" or null.
 */
export function renderChoiceList({ inputType, name, choices, locked, lettered }) {
  const items = choices.map((choice, position) => {
    const classes = ["opt"];
    if (choice.selected) classes.push("is-selected");
    let icon = "";
    if (choice.mark === "correct") { classes.push("is-correct"); icon = markIcon("good", "correct answer"); }
    if (choice.mark === "wrong") { classes.push("is-wrong"); icon = markIcon("bad", "incorrect"); }
    if (choice.mark === "missed") { classes.push("is-missed"); icon = markIcon("part", "missed correct answer"); }
    const letter = lettered ? `${LETTERS[position]}.` : "";
    return `<label class="${classes.join(" ")}">` +
      `<input type="${inputType}" name="${name}" value="${escapeHtml(choice.value)}" data-choice="${escapeHtml(choice.value)}"${choice.selected ? " checked" : ""}${locked ? " disabled" : ""}>` +
      `<span class="letter">${letter}</span><span class="otext">${choice.html}</span>${icon}</label>`;
  });
  return `<div class="opts"${inputType === "radio" ? ' role="radiogroup"' : ""}>${items.join("")}</div>`;
}

/** A short hint shown above an answer area. */
export function hint(text) {
  return `<p class="hint">${escapeHtml(text)}</p>`;
}
