/**
 * Multiple choice: exactly one correct option.
 *
 * Data: options: [{ text, correct: true }, { text, why }, ...]
 * Response: index of the chosen option, or null.
 */

import { formatInline, shuffle, seededShuffle } from "../core/text.js";
import { renderChoiceList } from "./shared.js";

export const multipleChoice = {
  name: "multiple-choice",
  label: "Multiple choice",

  prepare(question, random) {
    return { order: shuffle(question.options.map((_, i) => i), random) };
  },

  emptyResponse() {
    return null;
  },

  isAnswered(attempt) {
    return attempt.response !== null;
  },

  grade(question, response) {
    return response !== null && question.options[response].correct ? 1 : 0;
  },

  renderInput(attempt, { locked, reveal, key }) {
    const { question, view, response } = attempt;
    const choices = view.order.map(i => {
      const option = question.options[i];
      let mark = null;
      if (reveal && option.correct) mark = "correct";
      else if (reveal && response === i) mark = "wrong";
      return { value: i, html: formatInline(option.text), selected: response === i, mark };
    });
    return renderChoiceList({ inputType: "radio", name: key, choices, locked, lettered: true });
  },

  readInput(attempt, input) {
    if (input.dataset.choice === undefined) return false;
    attempt.response = Number(input.dataset.choice);
    return true;
  },

  renderCorrect(question) {
    return `<p>${formatInline(question.options.find(o => o.correct).text)}</p>`;
  },

  listMistakes({ question, response }) {
    if (response === null) return ["You didn't choose an answer."];
    const chosen = question.options[response];
    if (chosen.correct) return [];
    return [`You chose <em>${formatInline(chosen.text)}</em>. ${formatInline(chosen.why || "")}`];
  },

  renderPreview(question) {
    const items = seededShuffle(question.options, question.id).map(o => `<li>${formatInline(o.text)}</li>`);
    return `<ol class="pv-opts">${items.join("")}</ol>`;
  }
};
