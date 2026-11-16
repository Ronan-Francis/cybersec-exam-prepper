/**
 * True / false.
 *
 * Data: answer: true | false
 * Response: true, false, or null before answering.
 */

import { renderChoiceList, hint } from "./shared.js";

const label = value => (value ? "True" : "False");

export const trueFalse = {
  name: "true-false",
  label: "True / false",

  prepare() {
    return {};
  },

  emptyResponse() {
    return null;
  },

  isAnswered(attempt) {
    return attempt.response !== null;
  },

  grade(question, response) {
    return response === question.answer ? 1 : 0;
  },

  renderInput(attempt, { locked, reveal, key }) {
    const { question, response } = attempt;
    const choices = [true, false].map(value => {
      let mark = null;
      if (reveal && value === question.answer) mark = "correct";
      else if (reveal && value === response) mark = "wrong";
      return { value: String(value), html: label(value), selected: response === value, mark };
    });
    return renderChoiceList({ inputType: "radio", name: key, choices, locked, lettered: false });
  },

  readInput(attempt, input) {
    if (input.dataset.choice === undefined) return false;
    attempt.response = input.dataset.choice === "true";
    return true;
  },

  renderCorrect(question) {
    return `<p>${label(question.answer)}</p>`;
  },

  listMistakes({ question, response }) {
    if (response === null) return ["You didn't choose an answer."];
    if (response === question.answer) return [];
    return [`You chose <em>${label(response)}</em>, but the statement is ${label(question.answer).toLowerCase()}.`];
  },

  renderPreview() {
    return hint("True or false?");
  }
};
