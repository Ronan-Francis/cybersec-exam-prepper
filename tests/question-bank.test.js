/**
 * Checks the question bank's structure and the content rules agreed for the exam:
 * concept-focused, self-contained, unambiguous, no giveaways.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadData } from "./helpers.js";
import { getQuestionType } from "../js/question-types/index.js";

const { chapters, concepts, questions } = await loadData();
const conceptIds = new Set(concepts.map(c => c.id));
const allText = q => JSON.stringify(q);

test("every question has a unique id, a known chapter and a known type", () => {
  const ids = questions.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate question ids");
  for (const q of questions) {
    assert.ok(chapters.some(c => c.id === q.chapter), `${q.id}: unknown chapter ${q.chapter}`);
    assert.doesNotThrow(() => getQuestionType(q.type), `${q.id}: unknown type ${q.type}`);
    assert.ok(q.prompt && q.explanation, `${q.id}: needs a prompt and an explanation`);
  }
});

test("every question is tagged with 1 to 3 known concepts, and every concept is used", () => {
  for (const q of questions) {
    assert.ok(q.concepts.length >= 1 && q.concepts.length <= 3, `${q.id}: has ${q.concepts.length} concepts`);
    q.concepts.forEach(c => assert.ok(conceptIds.has(c), `${q.id}: unknown concept ${c}`));
  }
  for (const c of concepts) assert.ok(questions.some(q => q.concepts.includes(c.id)), `concept ${c.id} has no questions`);
});

test("choice questions have the right number of correct options, and every wrong option says why", () => {
  for (const q of questions.filter(q => q.type === "multiple-choice" || q.type === "multiple-response")) {
    const correct = q.options.filter(o => o.correct).length;
    if (q.type === "multiple-choice") assert.equal(correct, 1, `${q.id}: needs exactly one correct option`);
    else assert.ok(correct >= 1 && correct < q.options.length, `${q.id}: needs some, but not all, options correct`);
    q.options.filter(o => !o.correct).forEach(o => assert.ok(o.why, `${q.id}: wrong option "${o.text}" has no reason`));
  }
});

test("no em dashes, and no references to the lecture or slides", () => {
  for (const q of questions) {
    assert.ok(!allText(q).includes("\u2014"), `${q.id}: contains an em dash`);
    assert.ok(!/\blecture\b|lecture's|\bslides?\b/i.test(allText(q)), `${q.id}: refers to the lecture or slides`);
  }
});

test("code named in a prompt is shown in the question", () => {
  for (const q of questions) {
    const identifiers = (q.prompt.match(/`([a-z]+[A-Z]\w*)`/g) || []).map(s => s.slice(1, -1));
    const visible = (q.code || "") + JSON.stringify(q.options || []);
    identifiers.forEach(id => assert.ok(visible.includes(id), `${q.id}: names \`${id}\` without showing it`));
  }
});

test("no fine technical internals the exam won't ask about", () => {
  const fine = /\$STANDARD_INFORMATION|\$FILE_NAME|\$LogFile|\bVCN\b|\bLCN\b|USBSTOR|Argon2i\b|Argon2d\b|__Host-|\bDCT\b|spread spectrum|\bm=|\bt=|\bp=/;
  questions.forEach(q => assert.ok(!fine.test(allText(q)), `${q.id}: uses a fine technical internal`));
});

test("the correct option isn't usually the longest or the shortest", () => {
  const choice = questions.filter(q => q.type === "multiple-choice");
  const rank = q => {
    const lengths = q.options.map(o => o.text.length);
    const correctLength = q.options.find(o => o.correct).text.length;
    return lengths.filter(l => l < correctLength).length;
  };
  const longest = choice.filter(q => rank(q) === q.options.length - 1).length / choice.length;
  const shortest = choice.filter(q => rank(q) === 0).length / choice.length;
  assert.ok(longest <= 0.4, `correct option is the longest ${Math.round(longest * 100)}% of the time`);
  assert.ok(shortest <= 0.4, `correct option is the shortest ${Math.round(shortest * 100)}% of the time`);
});

test("true/false answers are roughly balanced", () => {
  const trueFalse = questions.filter(q => q.type === "true-false");
  const share = trueFalse.filter(q => q.answer).length / trueFalse.length;
  assert.ok(share >= 0.35 && share <= 0.65, `${Math.round(share * 100)}% of true/false answers are True`);
});

test("matching questions have at least two pairs with distinct items", () => {
  for (const q of questions.filter(q => q.type === "matching")) {
    assert.ok(q.pairs.length >= 2, `${q.id}: needs at least two pairs`);
    assert.equal(new Set(q.pairs.map(p => p.item)).size, q.pairs.length, `${q.id}: duplicate items`);
  }
});
