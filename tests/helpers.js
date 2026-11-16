/**
 * Shared test helpers: load the real data from disk and make a repeatable random generator.
 */

import { loadAppData } from "../js/data/load-data.js";
import { createGraph } from "../js/core/graph.js";
import { readJsonFromDisk } from "../tools/read-json.js";

export async function loadData() {
  return loadAppData(readJsonFromDisk, "data/");
}

export async function loadGraph() {
  const data = await loadData();
  return { data, graph: createGraph({ graphData: data.graph, questions: data.questions, concepts: data.concepts, chapters: data.chapters }) };
}

/** A seeded pseudo-random generator, so engine tests behave the same every run. */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => (state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}
