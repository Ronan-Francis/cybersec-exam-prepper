/**
 * Generates data/graph.json from the question files and concepts.
 * Run after adding or editing questions:  npm run graph
 */

import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadQuestionBank } from "../js/data/load-data.js";
import { similarityMatrix, conceptLinks, triangleIndex, LINK_RULES } from "../js/core/similarity.js";
import { readJsonFromDisk, projectPath } from "./read-json.js";

export async function buildGraph() {
  const { chapters, concepts, questions } = await loadQuestionBank(readJsonFromDisk, "data/");
  const ids = questions.map(q => q.id);
  const similarity = similarityMatrix(questions);
  const strengthOf = (a, b) => similarity[triangleIndex(ids.indexOf(a), ids.indexOf(b), ids.length)];
  const links = conceptLinks(questions, concepts, strengthOf);

  return {
    description: "CSSP question graph. Each question links to its concepts with strength 1, each concept to its chapter, and every pair of questions to each other.",
    rules: {
      questionToTopic: 1,
      questionToQuestion: `${LINK_RULES.sharedConceptBase} + ${LINK_RULES.sharedConceptBonus} x concept overlap if they share a concept, else ${LINK_RULES.sameChapter} if same chapter, else 0; plus ${LINK_RULES.wording} x wording similarity; clamped to ${LINK_RULES.minimum}..1`,
      similarityLayout: "Flat upper triangle: the pair (i, j) with i < j is at i*n - i*(i+1)/2 + (j - i - 1), where n is the number of questionIds."
    },
    counts: {
      chapters: chapters.length,
      concepts: concepts.length,
      questions: questions.length,
      topicLinks: questions.reduce((sum, q) => sum + q.concepts.length, 0),
      questionLinks: similarity.length,
      conceptLinks: links.length
    },
    questionIds: ids,
    similarity,
    conceptLinks: links
  };
}

// Run directly: write the file and report. pathToFileURL makes the comparison work on Windows paths too.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const graph = await buildGraph();
  await writeFile(projectPath("data/graph.json"), JSON.stringify(graph) + "\n");
  console.log("Wrote data/graph.json", JSON.stringify(graph.counts));
}
