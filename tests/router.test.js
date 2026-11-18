/**
 * The mode router: every visit enters the mode afresh, the current mode's tab is disabled,
 * and the page hash (Back and Forward) moves between modes. Runs against a stand-in window.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRouter, modeFromHash } from "../js/app/router.js";

/** A minimal window: a hash that fires hashchange (on the next tick, like a browser) and a body. */
function fakeWindow(initialHash = "") {
  const listeners = {};
  let hash = initialHash;
  const win = {
    document: { body: { dataset: {} } },
    scrollTo() {},
    addEventListener: (type, fn) => (listeners[type] ||= []).push(fn),
    location: {
      get hash() { return hash; },
      set hash(value) {
        const next = value ? `#${String(value).replace(/^#/, "")}` : "";
        if (next === hash) return;
        hash = next;
        win.pending = Promise.resolve().then(() => listeners.hashchange?.forEach(fn => fn()));
      }
    },
    // replaceState changes the address without a hashchange event, as in a browser.
    history: { replaceState: (state, title, url) => (hash = url) },
    pending: Promise.resolve(),
    /** Simulates Back or Forward to a URL with this hash, then waits for the router to react. */
    async navigate(value) {
      win.location.hash = value;
      await win.pending;
    }
  };
  return win;
}

function fakeTab(mode) {
  const attributes = {};
  const clicks = [];
  return {
    dataset: { mode },
    disabled: false,
    setAttribute: (name, value) => (attributes[name] = String(value)),
    removeAttribute: name => delete attributes[name],
    getAttribute: name => attributes[name] ?? null,
    addEventListener: (type, fn) => type === "click" && clicks.push(fn),
    // A disabled button never fires click in a browser.
    click() { if (!this.disabled) clicks.forEach(fn => fn()); },
    // A click that reaches the handler anyway (for example if the disabled state were removed by hand).
    forceClick: () => clicks.forEach(fn => fn())
  };
}

/** Modes that log their enter and leave calls. Quiz's confirmLeave answers with allowLeave.quiz. */
function setup(initialHash = "") {
  const log = [];
  const allowLeave = { quiz: true };
  const modes = ["quiz", "infinite", "study"].map(name => ({
    name,
    enter: params => log.push(`enter ${name}${Object.keys(params).length ? ` ${JSON.stringify(params)}` : ""}`),
    leave: () => log.push(`leave ${name}`),
    ...(name === "quiz" && { confirmLeave: () => { log.push("confirm quiz"); return allowLeave.quiz; } })
  }));
  const tabs = modes.map(m => fakeTab(m.name));
  const tab = name => tabs.find(t => t.dataset.mode === name);
  const win = fakeWindow(initialHash);
  const router = createRouter({ modes, tabs, defaultMode: "quiz", win });
  return { log, tabs, tab, win, router, allowLeave };
}

/** The log without the confirm calls, for tests about switching rather than asking. */
const switches = log => log.filter(entry => !entry.startsWith("confirm"));

test("modeFromHash falls back to the default mode for an empty or unknown hash", () => {
  const names = ["quiz", "infinite", "study"];
  assert.equal(modeFromHash("#study", names, "quiz"), "study");
  assert.equal(modeFromHash("", names, "quiz"), "quiz");
  assert.equal(modeFromHash("#", names, "quiz"), "quiz");
  assert.equal(modeFromHash("#nonsense", names, "quiz"), "quiz");
});

test("starting opens the mode in the hash, or the default", () => {
  const plain = setup();
  plain.router.start();
  assert.deepEqual(plain.log, ["enter quiz"]);
  assert.equal(plain.win.location.hash, "", "the default mode doesn't need a hash");

  const bookmarked = setup("#study");
  bookmarked.router.start();
  assert.deepEqual(bookmarked.log, ["enter study"]);
});

test("only the current mode's tab is disabled and marked aria-current", () => {
  const { router, tabs, tab, win } = setup();
  router.start();
  tab("infinite").click();
  assert.equal(router.current(), "infinite");
  assert.equal(win.document.body.dataset.mode, "infinite");
  for (const t of tabs) {
    const isCurrent = t.dataset.mode === "infinite";
    assert.equal(t.disabled, isCurrent, `${t.dataset.mode} disabled`);
    assert.equal(t.getAttribute("aria-current"), isCurrent ? "page" : null, `${t.dataset.mode} aria-current`);
  }
});

test("clicking the current mode's tab does nothing", () => {
  const { router, tab, log } = setup();
  router.start();
  tab("quiz").click();
  tab("quiz").forceClick();
  assert.deepEqual(log, ["enter quiz"]);
});

test("each tab click leaves the old mode and enters the new one afresh", async () => {
  const { router, tab, log, win } = setup();
  router.start();
  tab("infinite").click();
  tab("study").click();
  tab("quiz").click();
  tab("infinite").click();
  await win.pending;
  assert.deepEqual(switches(log), [
    "enter quiz",
    "leave quiz", "enter infinite",
    "leave infinite", "enter study",
    "leave study", "enter quiz",
    "leave quiz", "enter infinite"
  ]);
  assert.equal(win.location.hash, "#infinite");
});

test("the hash change a tab click makes doesn't enter the mode twice", async () => {
  const { router, tab, log, win } = setup();
  router.start();
  tab("study").click();
  await win.pending;
  assert.deepEqual(switches(log), ["enter quiz", "leave quiz", "enter study"]);
});

test("Back and Forward switch modes, including back to the page with no hash", async () => {
  const { router, tab, log, win } = setup();
  router.start();
  tab("infinite").click();
  await win.pending;
  log.length = 0;
  await win.navigate("");
  assert.equal(router.current(), "quiz");
  await win.navigate("study");
  assert.equal(router.current(), "study");
  await win.navigate("nonsense");
  assert.equal(router.current(), "quiz");
  assert.deepEqual(switches(log), ["leave infinite", "enter quiz", "leave quiz", "enter study", "leave study", "enter quiz"]);
});

test("cross-mode links can re-enter the current mode with new parameters", () => {
  const { router, tab, log } = setup();
  router.start();
  tab("infinite").click();
  router.go("infinite", { focus: "xss" });
  router.go("study", { concept: "csrf" });
  assert.deepEqual(log.slice(-4), ["leave infinite", 'enter infinite {"focus":"xss"}', "leave infinite", 'enter study {"concept":"csrf"}']);
});

test("leaving a mode asks its confirmLeave first, and staying keeps everything as it was", () => {
  const { router, tab, tabs, log, win, allowLeave } = setup();
  router.start();
  allowLeave.quiz = false;
  tab("study").click();
  assert.deepEqual(log, ["enter quiz", "confirm quiz"], "the quiz isn't left");
  assert.equal(router.current(), "quiz");
  assert.equal(win.document.body.dataset.mode, "quiz");
  assert.deepEqual(tabs.map(t => t.disabled), [true, false, false]);
  assert.equal(win.location.hash, "");
  assert.equal(router.go("infinite", { focus: "xss" }), false, "cross-mode links are stopped too");

  allowLeave.quiz = true;
  tab("study").click();
  assert.deepEqual(log.slice(-3), ["confirm quiz", "leave quiz", "enter study"]);
});

test("staying after Back or Forward puts the address back", async () => {
  const { router, tab, log, win, allowLeave } = setup();
  router.start();
  tab("study").click();
  tab("quiz").click();
  await win.pending;
  allowLeave.quiz = false;
  log.length = 0;
  await win.navigate("study");
  assert.deepEqual(log, ["confirm quiz"]);
  assert.equal(router.current(), "quiz");
  assert.equal(win.location.hash, "#quiz");
});

test("modes without confirmLeave are left without asking", () => {
  const { router, tab, log } = setup("#infinite");
  router.start();
  tab("study").click();
  assert.deepEqual(log, ["enter infinite", "leave infinite", "enter study"]);
});
