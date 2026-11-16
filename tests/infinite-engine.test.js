/**
 * How Infinite mode picks questions.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGraph, seededRandom } from "./helpers.js";
import { createInfiniteEngine } from "../js/core/infinite-engine.js";

const { graph } = await loadGraph();

test("warm-up spreads across chapters before any miss", () => {
  const engine = createInfiniteEngine(graph, { random: seededRandom(7) });
  const picks = [];
  for (let i = 0; i < 5; i++) {
    const pick = engine.next();
    assert.equal(pick.reason.type, "warmup");
    picks.push(pick.id);
    engine.record(pick.id, 1);
  }
  assert.equal(new Set(picks.map(id => graph.chapterOf(id))).size, 5);
});

test("a miss brings in strongly linked questions, then comes back itself", () => {
  const engine = createInfiniteEngine(graph, { random: seededRandom(7) });
  for (let i = 0; i < 5; i++) engine.record(engine.next().id, 1);
  const missed = "2-17";
  engine.record(missed, 0);

  const picks = [];
  for (let i = 0; i < 6; i++) { const pick = engine.next(); picks.push(pick); engine.record(pick.id, 1); }
  const similar = picks.filter(p => p.reason.type === "similar");
  assert.ok(similar.length >= 2, "expected similar questions after a miss");
  similar.forEach(p => assert.ok(graph.strength(missed, p.id) >= 0.6, `${p.id} isn't strongly linked to the miss`));

  const back = picks.findIndex(p => p.id === missed);
  assert.ok(back >= 2 && back <= 4, `the miss came back at position ${back}`);
  assert.equal(picks[back].reason.type, "reask");
  assert.ok(!engine.state.misses.has(missed), "answering the miss correctly clears it");
});

test("no question repeats within four picks, and partial marks count as misses", () => {
  const engine = createInfiniteEngine(graph, { random: seededRandom(42) });
  let recent = [];
  for (let i = 0; i < 300; i++) {
    const pick = engine.next();
    assert.ok(!recent.includes(pick.id), `${pick.id} repeated too soon`);
    recent = [...recent, pick.id].slice(-4);
    engine.record(pick.id, i % 5 === 0 ? 0.5 : 1);
  }
  assert.ok(engine.state.history.some(h => h.score < 1));
});

test("with many misses, re-asks are capped so similar questions still come through", () => {
  const engine = createInfiniteEngine(graph, { random: seededRandom(11) });
  const kinds = {};
  for (let i = 0; i < 60; i++) {
    const pick = engine.next();
    kinds[pick.reason.type] = (kinds[pick.reason.type] || 0) + 1;
    engine.record(pick.id, i % 3 === 0 ? 1 : 0);
  }
  assert.ok((kinds.reask || 0) <= 21, `${kinds.reask} re-asks in 60 picks`);
  assert.ok((kinds.similar || 0) >= 20, `only ${kinds.similar} similar picks`);
});

test("a focus concept is asked first, then its nearest neighbours", () => {
  const engine = createInfiniteEngine(graph, { random: seededRandom(3), focus: "salt" });
  const salt = graph.questionsFor("salt");
  for (let i = 0; i < salt.length; i++) {
    const pick = engine.next();
    assert.ok(salt.includes(pick.id) && pick.reason.type === "focus", `${pick.id} isn't a salt question`);
    engine.record(pick.id, 1);
  }
  const after = engine.next();
  assert.equal(after.reason.type, "focus-near");
  assert.ok(!salt.includes(after.id));
});
