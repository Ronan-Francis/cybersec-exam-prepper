/**
 * Multiple response ("select all that apply"): one or more correct options.
 *
 * Data: options: [{ text, correct: true }, { text, why }, ...]
 * Response: array of ticked option indexes.
 * Marking follows the common Moodle setting: each correct tick earns 1/k of the mark,
 * each wrong tick loses 1/(n-k), and the total never drops below 0. Ticking everything scores 0.
 */

import { formatInline, shuffle, seededShuffle } from "../core/text.js";
import { renderChoiceList, hint } from "./shared.js";

const correctIndexes = question => question.options.flatMap((o, i) => (o.correct ? [i] : []));

export const multipleResponse = {
  name: "multiple-response",
  label: "Multiple response",

  prepare(question, random) {
    return { order: shuffle(question.options.map((_, i) => i), random) };
  },

  emptyResponse() {
    return [];
  },

  isAnswered(attempt) {
    return attempt.response.length > 0;
  },

  grade(question, response) {
    const correct = correctIndexes(question);
    const wrongCount = question.options.length - correct.length;
    const right = response.filter(i => question.options[i].correct).length;
    const wrong = response.length - right;
    const mark = right / correct.length - (wrongCount ? wrong / wrongCount : 0);
    return Math.max(0, Math.min(1, mark));
  },

  renderInput(attempt, { locked, reveal, key }) {
    const { question, view, response } = attempt;
    const choices = view.order.map(i => {
      const option = question.options[i];
      const ticked = response.includes(i);
      let mark = null;
      if (reveal && option.correct) mark = ticked ? "correct" : "missed";
      else if (reveal && ticked) mark = "wrong";
      return { value: i, html: formatInline(option.text), selected: ticked, mark };
    });
    return hint("Select one or more.") + renderChoiceList({ inputType: "checkbox", name: key, choices, locked, lettered: true });
  },

  readInput(attempt, input) {
    if (input.dataset.choice === undefined) return false;
    const index = Number(input.dataset.choice);
    const without = attempt.response.filter(i => i !== index);
    attempt.response = input.checked ? [...without, index] : without;
    return true;
  },

  renderCorrect(question) {
    const items = correctIndexes(question).map(i => `<li>${formatInline(question.options[i].text)}</li>`);
    return `<ul>${items.join("")}</ul>`;
  },

  listMistakes({ question, response }) {
    if (!response.length) return ["You didn't tick anything."];
    const wrongTicks = response
      .filter(i => !question.options[i].correct)
      .map(i => `You ticked <em>${formatInline(question.options[i].text)}</em>. ${formatInline(question.options[i].why || "That option is not correct.")}`);
    const missed = correctIndexes(question)
      .filter(i => !response.includes(i))
      .map(i => `You missed <em>${formatInline(question.options[i].text)}</em>, which is also correct.`);
    return [...wrongTicks, ...missed];
  },

  renderPreview(question) {
    const items = seededShuffle(question.options, question.id).map(o => `<li>${formatInline(o.text)}</li>`);
    return hint("Select all that apply.") + `<ol class="pv-opts">${items.join("")}</ol>`;
  }
};
