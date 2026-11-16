/**
 * The "New quiz" panel: style (practice or exam), chapters, question types, length,
 * "only questions I got wrong before", and the two presets.
 */

import { escapeHtml, shuffle, plural } from "../../core/text.js";
import { QUESTION_TYPES } from "../../question-types/index.js";
import { $, $$, isNarrowScreen, scrollBehaviour } from "../../ui/dom.js";

const PRESETS = {
  mock: { style: "exam", length: "30" },
  quick: { style: "practice", length: "10" }
};

/** onStart(questions, style, { scroll }) is called when the user starts a quiz. */
export function createQuizSetup(app, { onStart }) {
  const panel = $("#setup");
  const form = $("#setupForm");
  const typesInBank = QUESTION_TYPES.filter(type => app.questions.some(q => q.type === type.name));

  renderLists();
  bindEvents();
  refresh();
  if (isNarrowScreen()) panel.open = false;

  function renderLists() {
    const count = predicate => app.questions.filter(predicate).length;
    const row = (name, value, label, total) =>
      `<label class="pick"><input type="checkbox" name="${name}" value="${value}" checked><span>${label} <span class="muted">(${total})</span></span></label>`;
    $("#chapterList").innerHTML = app.chapters.map(c => row("ch", c.id, `${c.id}. ${escapeHtml(c.short)}`, count(q => q.chapter === c.id))).join("");
    $("#typeList").innerHTML = typesInBank.map(t => row("ty", t.name, t.label, count(q => q.type === t.name))).join("");
  }

  function readSettings() {
    return {
      style: $("input[name=style]:checked", form).value,
      chapters: new Set($$("input[name=ch]:checked", form).map(i => Number(i.value))),
      types: new Set($$("input[name=ty]:checked", form).map(i => i.value)),
      length: $("#count", form).value,
      onlyMissed: $("#missed", form).checked
    };
  }

  function matchingQuestions(settings) {
    const missed = settings.onlyMissed ? app.history.missedIds(app.questions.map(q => q.id)) : null;
    return app.questions.filter(q => settings.chapters.has(q.chapter) && settings.types.has(q.type) && (!missed || missed.has(q.id)));
  }

  /** Updates the "N questions to draw from" line and the missed-question count. */
  function refresh() {
    const missedCount = app.history.missedIds(app.questions.map(q => q.id)).size;
    $("#missedCount").textContent = missedCount ? `(${missedCount})` : "(none yet)";
    const matches = matchingQuestions(readSettings()).length;
    const info = $("#poolInfo");
    info.classList.toggle("warn", !matches);
    info.textContent = matches
      ? `${plural(matches, "question")} to draw from.`
      : "Nothing matches. Pick at least one chapter and one question type.";
  }

  function start({ scroll = true } = {}) {
    const settings = readSettings();
    const pool = shuffle(matchingQuestions(settings));
    if (!pool.length) { refresh(); return; }
    const length = settings.length === "all" ? pool.length : Math.min(pool.length, Number(settings.length));
    onStart(pool.slice(0, length), settings.style, { scroll });
    if (isNarrowScreen()) panel.open = false;
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    $(`input[name=style][value=${preset.style}]`, form).checked = true;
    $$("input[name=ch], input[name=ty]", form).forEach(i => (i.checked = true));
    $("#count", form).value = preset.length;
    $("#missed", form).checked = false;
    refresh();
    start();
  }

  function bindEvents() {
    form.addEventListener("change", refresh);
    form.addEventListener("click", event => {
      const button = event.target.closest("button[data-all], button[data-none]");
      if (!button) return;
      const group = button.dataset.all || button.dataset.none;
      $$(`input[name=${group}]`, form).forEach(i => (i.checked = !!button.dataset.all));
      refresh();
    });
    form.addEventListener("submit", event => { event.preventDefault(); start(); });
    $$("[data-preset]").forEach(button => button.addEventListener("click", () => applyPreset(button.dataset.preset)));
  }

  return {
    refresh,
    start,
    /** Opens the panel and scrolls to it, for the "Change settings" button. */
    open() {
      panel.open = true;
      panel.scrollIntoView({ behavior: scrollBehaviour() });
    }
  };
}
