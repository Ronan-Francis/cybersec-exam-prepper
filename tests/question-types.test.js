/**
 * Marking and response handling for every question type.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadData } from "./helpers.js";
import { getQuestionType } from "../js/question-types/index.js";
import { createAttempt, isAnswered } from "../js/core/attempt.js";
import { parseMissingWords } from "../js/question-types/missing-words.js";

const { questions } = await loadData();

/** The response that should earn full marks for a question. */
function perfectResponse(q) {
  switch (q.type) {
    case "multiple-choice": return q.options.findIndex(o => o.correct);
    case "multiple-response": return q.options.flatMap((o, i) => (o.correct ? [i] : []));
    case "true-false": return q.answer;
    case "matching": return q.pairs.map(p => p.match);
    case "ordering": return q.steps.map((_, i) => i);
    case "missing-words": return parseMissingWords(q.text).blanks.map(b => b.answer);
    case "short-answer": return q.accept[0];
  }
}

test("the correct response earns full marks for every question", () => {
  for (const q of questions) assert.equal(getQuestionType(q.type).grade(q, perfectResponse(q)), 1, q.id);
});

test("a fresh attempt is unanswered and doesn't already score full marks", () => {
  for (const q of questions) {
    const attempt = createAttempt(q);
    assert.equal(isAnswered(attempt), false, `${q.id} looks answered before any input`);
    assert.ok(getQuestionType(q.type).grade(q, attempt.response) < 1, `${q.id} scores full marks untouched`);
  }
});

test("every type can show the correct answer, list mistakes and preview without throwing", () => {
  for (const q of questions) {
    const type = getQuestionType(q.type);
    const attempt = createAttempt(q);
    assert.ok(type.renderCorrect(q).length > 0, q.id);
    assert.ok(Array.isArray(type.listMistakes(attempt)), q.id);
    assert.ok(type.renderPreview(q).length > 0, q.id);
    assert.ok(type.renderInput(attempt, { locked: false, reveal: false, key: "t" }).length > 0, q.id);
  }
});

test("multiple response: ticking everything scores 0; wrong ticks cost marks", () => {
  const q = { type: "multiple-response", options: [1, 2, 3, 4].map(() => ({ text: "x", correct: true })).concat([{ text: "y", why: "-" }, { text: "z", why: "-" }]) };
  const type = getQuestionType(q.type);
  assert.equal(type.grade(q, [0, 1, 2, 3, 4, 5]), 0);
  assert.equal(type.grade(q, [0, 1]), 0.5);
  assert.equal(type.grade(q, [0, 1, 2, 3, 4]), 0.5);
});

test("ordering: credit for each adjacent pair in the right sequence", () => {
  const q = { type: "ordering", steps: ["A", "B", "C", "D"] };
  const type = getQuestionType(q.type);
  assert.equal(type.grade(q, [1, 2, 3, 0]), 2 / 3);
  assert.equal(type.grade(q, [3, 2, 1, 0]), 0);
});

test("ordering: a shuffled start is never already correct", () => {
  for (const q of questions.filter(q => q.type === "ordering")) {
    const attempt = createAttempt(q);
    assert.ok(!attempt.response.every((step, i) => step === i), q.id);
  }
});

test("short answer: ignores case, hyphens, a leading article and a trailing full stop", () => {
  const type = getQuestionType("short-answer");
  const q = { accept: ["cross-site request forgery", "salt", "fail closed", "trojan"] };
  ["Cross site request forgery", "a salt", "fail-closed", "The Trojan."].forEach(typed => assert.equal(type.grade(q, typed), 1, typed));
  assert.equal(type.grade(q, "pepper"), 0);
});

test("missing words: the first choice in each blank is the answer", () => {
  const { blanks } = parseMissingWords("A [[right|wrong]] and [[yes|no|maybe]].");
  assert.deepEqual(blanks.map(b => b.answer), ["right", "yes"]);
});
