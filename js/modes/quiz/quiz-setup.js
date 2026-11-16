/**
 * The "New quiz" panel: style (practice or exam), chapters, question types, length,
 * "only questions I got wrong before", and the two presets.
 */

import { escapeHtml, pad2, shuffle, plural } from "../../core/text.js";
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

  renderChips();
  bindEvents();
  refresh();
  if (isNarrowScreen()) panel.open = false;

  function renderChips() {
    const count = predicate => app.questions.filter(predicate).length;
    $("#chapterChips").innerHTML = app.chapters.map(c =>
      `<label class="chip"><input type="checkbox" name="ch" value="${c.id}" checked><span><b>${pad2(c.id)}</b> ${escapeHtml(c.short)} <em>${count(q => q.chapter === c.id)}</em></span></label>`).join("");
    $("#typeChips").innerHTML = typesInBank.map(t =>
      `<label class="chip"><input type="checkbox" name="ty" value="${t.name}" checked><span>${t.label} <em>${count(q => q.type === t.name)}</em></span></label>`).join("");
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

  /** Updates the "N questions match" line and the missed-question count. */
  function refresh() {
    const missedCount = app.history.missedIds(app.questions.map(q => q.id)).size;
    $("#missedCount").textContent = missedCount ? `(${missedCount} so far)` : "(none yet)";
    const matches = matchingQuestions(readSettings()).length;
    const info = $("#poolInfo");
    info.classList.toggle("warn", !matches);
    info.textContent = matches
      ? `${plural(matches, "question")} match these settings.`
      : "No questions match. Select at least one chapter and one question type.";
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
