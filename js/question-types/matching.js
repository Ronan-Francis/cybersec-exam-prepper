/**
 * Matching: pick the right answer for each item from a shared dropdown.
 *
 * Data: pairs: [{ item, match, why? }, ...]   (answers may repeat across items)
 * Response: array of chosen answers, one per pair, "" when unanswered.
 */

import { escapeHtml, formatInline, shuffle, seededShuffle } from "../core/text.js";
import { markIcon, hint } from "./shared.js";

const uniqueAnswers = question => [...new Set(question.pairs.map(p => p.match))];

export const matching = {
  name: "matching",
  label: "Matching",

  prepare(question, random) {
    return {
      itemOrder: shuffle(question.pairs.map((_, i) => i), random),
      answers: shuffle(uniqueAnswers(question), random)
    };
  },

  emptyResponse(question) {
    return question.pairs.map(() => "");
  },

  isAnswered(attempt) {
    return attempt.response.some(answer => answer !== "");
  },

  grade(question, response) {
    const right = question.pairs.filter((pair, i) => response[i] === pair.match).length;
    return right / question.pairs.length;
  },

  renderInput(attempt, { locked, reveal, key }) {
    const { question, view, response } = attempt;
    const eachOnce = uniqueAnswers(question).length === question.pairs.length;
    const rows = view.itemOrder.map(i => {
      const pair = question.pairs[i];
      const chosen = response[i];
      const band = reveal ? (chosen === pair.match ? "good" : "bad") : "";
      const id = `${key}-pair${i}`;
      const options = view.answers
        .map(answer => `<option value="${escapeHtml(answer)}"${chosen === answer ? " selected" : ""}>${escapeHtml(answer)}</option>`)
        .join("");
      return `<div class="mrow ${band}">` +
        `<label class="mleft" for="${id}">${formatInline(pair.item)}</label>` +
        `<div class="mright"><select id="${id}" data-pair="${i}"${locked ? " disabled" : ""}><option value="">Choose…</option>${options}</select>` +
        (reveal ? markIcon(band) : "") +
        (reveal && band === "bad" ? `<span class="mfix">Correct: ${formatInline(pair.match)}</span>` : "") +
        `</div></div>`;
    });
    return hint(eachOnce ? "Each answer is used once." : "Some answers are used more than once.") + `<div class="match">${rows.join("")}</div>`;
  },

  readInput(attempt, input) {
    if (input.dataset.pair === undefined) return false;
    attempt.response[Number(input.dataset.pair)] = input.value;
    return true;
  },

  renderCorrect(question) {
    const items = question.pairs.map(p =>
      `<li><span>${formatInline(p.item)}</span><span class="arrow" aria-hidden="true">→</span><strong>${formatInline(p.match)}</strong></li>`);
    return `<ul class="pairs">${items.join("")}</ul>`;
  },

  listMistakes({ question, response }) {
    return question.pairs.flatMap((pair, i) => {
      if (response[i] === pair.match) return [];
      const yours = response[i] ? `you chose ${formatInline(response[i])}` : "no answer";
      const reason = pair.why ? ` ${formatInline(pair.why)}` : "";
      return [`<em>${formatInline(pair.item)}</em>: ${yours}, but it's <strong>${formatInline(pair.match)}</strong>.${reason}`];
    });
  },

  renderPreview(question) {
    const items = question.pairs.map(p => `<li>${formatInline(p.item)}</li>`).join("");
    const chips = seededShuffle(uniqueAnswers(question), question.id).map(a => `<span class="pv-chip">${formatInline(a)}</span>`).join(" ");
    return `<ul class="pv-list">${items}</ul><p class="hint">Match each to: ${chips}</p>`;
  }
};
