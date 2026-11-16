/**
 * The shared app context handed to every mode: the data, lookups, the graph, saved history
 * and the page regions each mode draws into.
 */

import { createGraph } from "../core/graph.js";
import { createAnswerHistory } from "../storage/answer-history.js";
import { $ } from "../ui/dom.js";

export function createAppContext({ chapters, concepts, questions, graph: graphData }) {
  return {
    chapters,
    concepts,
    questions,
    chapterById: new Map(chapters.map(c => [c.id, c])),
    conceptById: new Map(concepts.map(c => [c.id, c])),
    questionById: new Map(questions.map(q => [q.id, q])),
    graph: createGraph({ graphData, questions, concepts, chapters }),
    history: createAnswerHistory(),
    elements: {
      stage: $("#stage"),
      quizSide: $("#quizSide"),
      infiniteSide: $("#infiniteSide")
    }
  };
}
