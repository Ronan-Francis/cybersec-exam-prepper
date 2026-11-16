/**
 * Select missing words: a passage with dropdown blanks.
 *
 * Data: text with blanks written as [[correct|wrong|wrong]], for example
 *   "Patching belongs to [[Prevent|Detect and respond|Recover]]."
 * Response: array of chosen words, one per blank, "" when unanswered.
 */

import { escapeHtml, formatInline, shuffle, seededShuffle } from "../core/text.js";

const BLANK = /\[\[(.+?)\]\]/g;

/** Splits the text into plain parts and blanks. Each blank's first choice is the correct one. */
export function parseMissingWords(text) {
  const parts = [];
  const blanks = [];
  let last = 0;
  for (const match of text.matchAll(BLANK)) {
    parts.push({ text: text.slice(last, match.index) });
    const choices = match[1].split("|");
    blanks.push({ answer: choices[0], choices });
    parts.push({ blank: blanks.length - 1 });
    last = match.index + match[0].length;
  }
  parts.push({ text: text.slice(last) });
  return { parts, blanks };
}

export const missingWords = {
  name: "missing-words",
  label: "Select missing words",

  prepare(question, random) {
    const { parts, blanks } = parseMissingWords(question.text);
    return { parts, blanks, choiceOrder: blanks.map(b => shuffle(b.choices, random)) };
  },

  emptyResponse(question) {
    return parseMissingWords(question.text).blanks.map(() => "");
  },

  isAnswered(attempt) {
    return attempt.response.some(word => word !== "");
  },

  grade(question, response) {
    const { blanks } = parseMissingWords(question.text);
    return blanks.filter((b, i) => response[i] === b.answer).length / blanks.length;
  },

  renderInput(attempt, { locked, reveal }) {
    const { view, response } = attempt;
    const html = view.parts.map(part => {
      if (part.text !== undefined) return formatInline(part.text);
      const i = part.blank;
      const band = reveal ? (response[i] === view.blanks[i].answer ? "good" : "bad") : "";
      const options = view.choiceOrder[i]
        .map(word => `<option value="${escapeHtml(word)}"${response[i] === word ? " selected" : ""}>${escapeHtml(word)}</option>`)
        .join("");
      return `<select class="gsel ${band}" data-blank="${i}" aria-label="Blank ${i + 1}"${locked ? " disabled" : ""}><option value="">…</option>${options}</select>`;
    });
    return `<p class="gaptext">${html.join("")}</p>`;
  },

  readInput(attempt, input) {
    if (input.dataset.blank === undefined) return false;
    attempt.response[Number(input.dataset.blank)] = input.value;
    return true;
  },

  renderCorrect(question) {
    const { parts, blanks } = parseMissingWords(question.text);
    const html = parts.map(p => (p.text !== undefined ? formatInline(p.text) : `<strong class="fill">${escapeHtml(blanks[p.blank].answer)}</strong>`));
    return `<p>${html.join("")}</p>`;
  },

  listMistakes({ question, response }) {
    return parseMissingWords(question.text).blanks.flatMap((blank, i) => {
      if (response[i] === blank.answer) return [];
      const yours = response[i] ? `you chose <em>${escapeHtml(response[i])}</em>` : "no answer";
      return [`Blank ${i + 1}: ${yours}, but it's <strong>${escapeHtml(blank.answer)}</strong>.`];
    });
  },

  renderPreview(question) {
    const { parts, blanks } = parseMissingWords(question.text);
    const html = parts.map(p => p.text !== undefined
      ? formatInline(p.text)
      : `<span class="pv-blank">${seededShuffle(blanks[p.blank].choices, question.id + p.blank).map(escapeHtml).join(" / ")}</span>`);
    return `<p class="pv-gap">${html.join("")}</p>`;
  }
};
