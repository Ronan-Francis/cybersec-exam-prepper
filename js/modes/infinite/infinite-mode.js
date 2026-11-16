/**
 * Infinite mode: an endless session that follows what you get wrong.
 * A session starts fresh each time (page load, "Start a new session", or practising a concept from Study mode)
 * and draws from every chapter. Switching tabs keeps the current session.
 */

import { createAttempt, checkAttempt } from "../../core/attempt.js";
import { createInfiniteEngine } from "../../core/infinite-engine.js";
import { $, revealIfScrolledPast, scrollIntoViewGently } from "../../ui/dom.js";
import { bindAnswerInputs, bindAnswerKeys } from "../../ui/answer-binding.js";
import { formatStopwatch } from "../../ui/format.js";
import { renderInfiniteQuestion, renderInfiniteSummary } from "./infinite-pages.js";
import { renderInfiniteSidePanel } from "./infinite-side-panel.js";

export function createInfiniteMode(app) {
  const { stage, infiniteSide } = app.elements;
  let session = null;
  let listeners = null;
  let timer = null;

  // ── session lifecycle ──

  function newSession(focus = null) {
    session = {
      engine: createInfiniteEngine(app.graph, { focus }),
      focus,
      current: null,              // { attempt, pick, number }
      questionNumbers: new Map(), // question id -> the number it was last asked as (for "linked to question 4")
      startedAt: Date.now(),
      endedAt: 0
    };
    nextQuestion();
  }

  function nextQuestion() {
    const pick = session.engine.next();
    const number = session.engine.state.history.length + 1;
    session.current = { attempt: createAttempt(app.questionById.get(pick.id)), pick, number };
    render();
    revealIfScrolledPast($(".qcard", stage));
  }

  function submit() {
    const { attempt, number } = session.current;
    if (attempt.checked) return;
    const score = checkAttempt(attempt);
    app.history.record(attempt.question.id, score);
    session.questionNumbers.set(attempt.question.id, number);
    session.engine.record(attempt.question.id, score);
    render();
    scrollIntoViewGently($(".feedback", stage));
  }

  function endSession() {
    session.endedAt = Date.now();
    render();
  }

  function clearFocus() {
    session.focus = null;
    session.engine.clearFocus();
    renderSide();
  }

  const currentAttempt = () => (session && !session.endedAt ? session.current.attempt : null);

  // ── drawing ──

  function render() {
    renderSide();
    stage.innerHTML = session.endedAt ? renderInfiniteSummary(app, session) : renderInfiniteQuestion(app, session);
  }

  function renderSide() {
    infiniteSide.innerHTML = renderInfiniteSidePanel(app, session);
  }

  function updateTimer() {
    const clock = $("#infiniteTimer");
    if (clock && session && !session.endedAt) clock.textContent = formatStopwatch(Date.now() - session.startedAt);
  }

  // ── events ──

  const actions = {
    submit,
    next: nextQuestion,
    end: endSession,
    new: () => newSession(null),
    "clear-focus": clearFocus
  };

  function handleClick(event) {
    const button = event.target.closest("button[data-act]");
    if (button) actions[button.dataset.act]?.();
  }

  function bindEvents(signal) {
    stage.addEventListener("click", handleClick, { signal });
    infiniteSide.addEventListener("click", handleClick, { signal });
    bindAnswerInputs({ root: stage, getAttempt: currentAttempt, onRerender: render, signal });
    bindAnswerKeys({ getAttempt: currentAttempt, onEnter: attempt => (attempt.checked ? nextQuestion() : submit()), signal });
  }

  return {
    name: "infinite",
    /** params.focus: a concept id to focus on, which always starts a new session. */
    enter(params = {}) {
      infiniteSide.hidden = false;
      listeners = new AbortController();
      bindEvents(listeners.signal);
      if ("focus" in params || !session || session.endedAt) newSession(params.focus || null);
      else render();
      timer = setInterval(updateTimer, 1000);
    },
    leave() {
      infiniteSide.hidden = true;
      listeners.abort();
      clearInterval(timer);
    }
  };
}
