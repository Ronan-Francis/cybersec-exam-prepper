/**
 * Quiz mode: a fixed set of questions, answered in Practice style (check each answer) or
 * Exam style (marked at the end), with Moodle-like navigation, a summary page and a results review.
 *
 * Pages: "question" -> "summary" -> "results".
 */

import { createAttempt, checkAttempt, isFullMarks, isAnswered } from "../../core/attempt.js";
import { shuffle } from "../../core/text.js";
import { $, revealIfScrolledPast, scrollIntoViewGently, scrollBehaviour } from "../../ui/dom.js";
import { updateInfo } from "../../ui/question-card.js";
import { bindAnswerInputs, bindAnswerKeys } from "../../ui/answer-binding.js";
import { formatStopwatch } from "../../ui/format.js";
import { createQuizSetup } from "./quiz-setup.js";
import { renderQuizNav } from "./quiz-nav.js";
import { renderQuestionPage } from "./quiz-question-page.js";
import { renderSummaryPage } from "./quiz-summary-page.js";
import { renderResultsPage } from "./quiz-results-page.js";

export function createQuizMode(app) {
  const { stage, quizSide } = app.elements;
  const state = { style: "practice", attempts: [], index: 0, page: "question", startedAt: 0, endedAt: 0, reviewFilter: "all" };
  const setup = createQuizSetup(app, { onStart: start });
  let listeners = null;
  let timer = null;

  // ── starting and moving through an attempt ──

  function start(questions, style, { scroll = true } = {}) {
    Object.assign(state, {
      style,
      attempts: questions.map(q => createAttempt(q)),
      index: 0,
      page: "question",
      startedAt: Date.now(),
      endedAt: 0,
      reviewFilter: "all"
    });
    render();
    if (scroll) stage.scrollIntoView({ block: "start", behavior: scrollBehaviour() });
  }

  const currentAttempt = () => (state.page === "question" ? state.attempts[state.index] : null);

  function goTo(index) {
    state.index = Math.max(0, Math.min(state.attempts.length - 1, index));
    state.page = "question";
    render();
    revealIfScrolledPast($(".que", stage));
  }

  function next() {
    if (state.index === state.attempts.length - 1) showSummary();
    else goTo(state.index + 1);
  }

  function showSummary() {
    state.page = "summary";
    render();
    stage.scrollIntoView({ block: "start" });
  }

  // ── marking ──

  function check() {
    const attempt = currentAttempt();
    if (!attempt || attempt.checked) return;
    app.history.record(attempt.question.id, checkAttempt(attempt));
    render();
    scrollIntoViewGently($(".outcome", stage));
  }

  function finish() {
    state.attempts.filter(a => !a.checked).forEach(a => app.history.record(a.question.id, checkAttempt(a)));
    state.endedAt = Date.now();
    state.page = "results";
    render();
    setup.refresh();
    stage.scrollIntoView({ block: "start", behavior: scrollBehaviour() });
  }

  function retryMisses() {
    const missed = state.attempts.filter(a => !isFullMarks(a.score)).map(a => a.question);
    start(shuffle(missed), state.style);
  }

  // ── drawing ──

  function render() {
    renderQuizNav(state);
    if (state.page === "question") stage.innerHTML = renderQuestionPage(state);
    else if (state.page === "summary") stage.innerHTML = renderSummaryPage(state);
    else stage.innerHTML = renderResultsPage(app, state);
    updateTimer();
  }

  /** Shown when the settings match no questions, so the previous mode's page isn't left on screen. */
  function showNothingToStart() {
    Object.assign(state, { attempts: [], index: 0, page: "question", startedAt: Date.now(), endedAt: 0 });
    renderQuizNav(state);
    $("#timer").textContent = formatStopwatch(0);
    stage.innerHTML = `
      <div class="page">
        <h2>No questions match your settings</h2>
        <p>Pick at least one chapter and one question type in the "New quiz" panel, then start the quiz.</p>
        <div><button type="button" class="btn primary" data-act="settings">Change settings</button></div>
      </div>`;
  }

  function updateTimer() {
    const end = state.page === "results" ? state.endedAt : Date.now();
    $("#timer").textContent = formatStopwatch(end - state.startedAt);
  }

  function showReviewCard(index) {
    if (state.reviewFilter === "wrong" && isFullMarks(state.attempts[index].score)) {
      state.reviewFilter = "all";
      render();
    }
    document.getElementById(`rv-${index}`)?.scrollIntoView({ block: "start", behavior: scrollBehaviour() });
  }

  // ── events ──

  function handleStageClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.goto !== undefined) return goTo(Number(button.dataset.goto));
    if (button.dataset.filter) { state.reviewFilter = button.dataset.filter; render(); return; }
    const actions = {
      flag: () => { currentAttempt().flagged = !currentAttempt().flagged; render(); },
      prev: () => goTo(state.index - 1),
      next,
      check,
      return: () => goTo(state.index),
      submit: finish,
      retry: retryMisses,
      again: () => setup.start(),
      settings: () => setup.open()
    };
    actions[button.dataset.act]?.();
  }

  function handleNavClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.goto !== undefined) goTo(Number(button.dataset.goto));
    if (button.dataset.review !== undefined) showReviewCard(Number(button.dataset.review));
  }

  function bindEvents(signal) {
    stage.addEventListener("click", handleStageClick, { signal });
    $("#navgrid").addEventListener("click", handleNavClick, { signal });
    $("#finishBtn").addEventListener("click", showSummary, { signal });
    bindAnswerInputs({ root: stage, getAttempt: currentAttempt, onAnswerChange: attempt => { renderQuizNav(state); updateInfo(stage, attempt, { number: state.index + 1, flag: true }); }, onRerender: render, signal });
    bindAnswerKeys({
      getAttempt: currentAttempt,
      onEnter: attempt => (state.style === "practice" && !attempt.checked ? check() : next()),
      onFlag: attempt => { attempt.flagged = !attempt.flagged; render(); },
      signal
    });
  }

  return {
    name: "quiz",
    /** Every visit starts a new attempt with the settings in the "New quiz" panel. */
    enter() {
      quizSide.hidden = false;
      listeners = new AbortController();
      bindEvents(listeners.signal);
      if (!setup.start({ scroll: false })) showNothingToStart();
      timer = setInterval(() => { if (state.page !== "results" && state.attempts.length) updateTimer(); }, 1000);
    },
    /** Asks before throwing away an unfinished attempt that has answers or flags in it. */
    confirmLeave() {
      const inProgress = state.page !== "results" && state.attempts.some(a => a.checked || a.flagged || isAnswered(a));
      return !inProgress || window.confirm("Leave this quiz? Your current attempt will be lost, and a new quiz starts next time you open Quiz.");
    },
    leave() {
      quizSide.hidden = true;
      listeners.abort();
      clearInterval(timer);
    }
  };
}
