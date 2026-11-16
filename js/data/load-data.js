/**
 * Loads the question bank, concepts and graph.
 *
 * In the browser it fetches the JSON files under data/. The single-file build inlines the same data
 * as globalThis.CSSP_DATA, so the loader returns that instead. Node tools and tests pass their own readJson.
 */

const fetchJson = path => fetch(path).then(response => {
  if (!response.ok) throw new Error(`Couldn't load ${path} (${response.status})`);
  return response.json();
});

/** Chapters, concepts and every question (questions are stored one file per chapter). */
export async function loadQuestionBank(readJson = fetchJson, base = "data/") {
  const chapters = await readJson(base + "chapters.json");
  const [concepts, ...questionsByChapter] = await Promise.all([
    readJson(base + "concepts.json"),
    ...chapters.map(chapter => readJson(base + chapter.file))
  ]);
  return { chapters, concepts, questions: questionsByChapter.flat() };
}

/** The question bank plus the generated graph. */
export async function loadAppData(readJson = fetchJson, base = "data/") {
  if (globalThis.CSSP_DATA) return globalThis.CSSP_DATA;
  const [bank, graph] = await Promise.all([loadQuestionBank(readJson, base), readJson(base + "graph.json")]);
  return { ...bank, graph };
}
