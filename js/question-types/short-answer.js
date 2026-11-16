/**
 * Short answer: type a word or phrase.
 *
 * Data: accept: ["first accepted answer", "another spelling", ...]
 * Response: the typed text.
 * Marking ignores case, hyphens versus spaces, a leading "a"/"an"/"the" and a trailing full stop.
 */

import { escapeHtml, formatInline } from "../core/text.js";
import { markIcon, hint } from "./shared.js";

/** Normalises a short answer so trivial differences don't cost marks. */
export function normaliseAnswer(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[-–]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .replace(/^(a|an|the) /, "");
}

export const shortAnswer = {
  name: "short-answer",
  label: "Short answer",

  prepare() {
    return {};
  },

  emptyResponse() {
    return "";
  },

  isAnswered(attempt) {
    return attempt.response.trim() !== "";
  },

  grade(question, response) {
    const typed = normaliseAnswer(response);
    return typed && question.accept.some(answer => normaliseAnswer(answer) === typed) ? 1 : 0;
  },

  renderInput(attempt, { locked, reveal, key }) {
    const id = `${key}-text`;
    const band = reveal ? (attempt.score >= 0.999 ? "good" : "bad") : "";
    return `<div class="inrow ${band}">` +
      `<label for="${id}">Answer:</label>` +
      `<input id="${id}" type="text" spellcheck="false" autocomplete="off" value="${escapeHtml(attempt.response)}" data-text="1"${locked ? " disabled" : ""}>` +
      (reveal ? markIcon(band) : "") +
      `</div>`;
  },

  readInput(attempt, input) {
    if (input.dataset.text === undefined) return false;
    attempt.response = input.value;
    return true;
  },

  renderCorrect(question) {
    return `<p>${formatInline(question.accept[0])}</p>`;
  },

  listMistakes({ response }) {
    return [response.trim() ? `You wrote <em>${escapeHtml(response)}</em>, which isn't an accepted answer.` : "You didn't write an answer."];
  },

  renderPreview() {
    return hint("Short answer: type a word or phrase.");
  }
};
