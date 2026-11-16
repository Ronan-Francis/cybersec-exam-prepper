/**
 * The question graph: shape, link strengths, and that data/graph.json is up to date.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGraph } from "./helpers.js";
import { buildGraph } from "../tools/build-graph.js";

const { data, graph } = await loadGraph();
const n = data.questions.length;

test("data/graph.json is up to date with the question files (run `npm run graph` if not)", async () => {
  const fresh = await buildGraph();
  assert.deepEqual(data.graph.questionIds, fresh.questionIds, "question ids changed");
  assert.deepEqual(data.graph.similarity, fresh.similarity, "link strengths changed");
  assert.deepEqual(data.graph.conceptLinks, fresh.conceptLinks, "concept links changed");
});

test("every question is a node and every pair of questions is linked", () => {
  assert.equal(graph.questionIds.length, n);
  assert.equal(data.graph.similarity.length, (n * (n - 1)) / 2);
  assert.ok(data.graph.similarity.every(s => s >= 0.01 && s <= 1), "strengths must be within 0.01 to 1");
});

test("links are symmetric, strong within a concept and weak between unrelated questions", () => {
  assert.equal(graph.strength("2-17", "2-03"), graph.strength("2-03", "2-17"));
  assert.ok(graph.strength("2-17", "2-03") > 0.6, "two STRIDE questions should be strongly linked");
  assert.ok(graph.strength("2-17", "9-30") < 0.25, "STRIDE and salting should be weakly linked");
  assert.equal(graph.strength("2-17", "2-17"), 1);
});

test("the closest questions to a STRIDE question are STRIDE questions", () => {
  const closest = graph.questionIds
    .filter(id => id !== "2-17")
    .sort((a, b) => graph.strength("2-17", b) - graph.strength("2-17", a))
    .slice(0, 4);
  closest.forEach(id => assert.ok(graph.conceptsOf(id).includes("stride"), `${id} isn't a STRIDE question`));
});

test("exported JSON lists every node and edge", () => {
  const { nodeCount, edgeCount } = graph.toJson();
  const counts = data.graph.counts;
  assert.equal(nodeCount, counts.chapters + counts.concepts + counts.questions);
  assert.equal(edgeCount, counts.concepts + counts.topicLinks + counts.questionLinks + counts.conceptLinks);
});
