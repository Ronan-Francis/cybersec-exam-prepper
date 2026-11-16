/**
 * Read-only queries over the question graph.
 *
 * Nodes: chapters, concepts and questions.
 * Edges: question -> concept (strength 1, from each question's "concepts" tags),
 *        question <-> question (every pair; strengths stored in data/graph.json),
 *        concept <-> concept (derived from the question links).
 */

import { triangleIndex } from "./similarity.js";

export function createGraph({ graphData, questions, concepts, chapters }) {
  const ids = graphData.questionIds;
  const indexOf = new Map(ids.map((id, i) => [id, i]));
  const questionById = new Map(questions.map(q => [q.id, q]));
  const questionsByConcept = new Map(concepts.map(c => [c.id, []]));
  questions.forEach(q => q.concepts.forEach(c => questionsByConcept.get(c).push(q.id)));
  const relatedByConcept = indexConceptLinks(graphData.conceptLinks, concepts);

  /** Link strength between two questions (1 for the same question). */
  function strength(a, b) {
    if (a === b) return 1;
    return graphData.similarity[triangleIndex(indexOf.get(a), indexOf.get(b), ids.length)];
  }

  return {
    questionIds: ids,
    counts: graphData.counts,
    description: graphData.description,
    strength,
    conceptsOf: id => questionById.get(id).concepts,
    chapterOf: id => questionById.get(id).chapter,
    questionsFor: conceptId => questionsByConcept.get(conceptId) || [],
    /** The concepts most closely linked to this one, strongest first: [[conceptId, strength], ...]. */
    relatedConcepts: (conceptId, limit = 5) => relatedByConcept.get(conceptId).slice(0, limit),
    /** Concept ids both questions are tagged with. */
    sharedConcepts: (a, b) => questionById.get(a).concepts.filter(c => questionById.get(b).concepts.includes(c)),
    toJson: () => exportGraph({ graphData, questions, concepts, chapters, strength })
  };
}

function indexConceptLinks(links, concepts) {
  const related = new Map(concepts.map(c => [c.id, []]));
  links.forEach(([a, b, w]) => { related.get(a).push([b, w]); related.get(b).push([a, w]); });
  related.forEach(list => list.sort((x, y) => y[1] - x[1]));
  return related;
}

/** The whole graph as explicit nodes and edges, for the "Copy graph data" button. */
function exportGraph({ graphData, questions, concepts, chapters, strength }) {
  const nodes = [
    ...chapters.map(c => ({ id: `ch:${c.id}`, type: "chapter", label: c.name })),
    ...concepts.map(c => ({ id: `c:${c.id}`, type: "concept", label: c.name, chapter: c.chapter, summary: c.summary })),
    ...questions.map(q => ({ id: `q:${q.id}`, type: "question", chapter: q.chapter, format: q.type, text: q.prompt }))
  ];
  const edges = [];
  concepts.forEach(c => edges.push({ source: `c:${c.id}`, target: `ch:${c.chapter}`, kind: "in-chapter", strength: 1 }));
  questions.forEach(q => q.concepts.forEach(c => edges.push({ source: `q:${q.id}`, target: `c:${c}`, kind: "has-topic", strength: 1 })));
  const ids = graphData.questionIds;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      edges.push({ source: `q:${ids[i]}`, target: `q:${ids[j]}`, kind: "similar", strength: strength(ids[i], ids[j]) });
    }
  }
  graphData.conceptLinks.forEach(([a, b, w]) => edges.push({ source: `c:${a}`, target: `c:${b}`, kind: "related", strength: w }));
  const json = JSON.stringify({ description: graphData.description, rules: graphData.rules, nodes, edges });
  return { json, nodeCount: nodes.length, edgeCount: edges.length };
}
