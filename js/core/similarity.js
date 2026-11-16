/**
 * Works out how strongly two questions are linked. Used by tools/build-graph.js to generate data/graph.json.
 *
 * Strength of a question-to-question link:
 *   share at least one concept:  0.60 + 0.20 x (shared concepts / all concepts of the two)
 *   share only a chapter:        0.25
 *   otherwise:                   0
 *   plus wording:                + 0.20 x cosine similarity of their key terms (TF-IDF)
 *   clamped to 0.01..1 and rounded to two decimals, so every pair is linked.
 */

export const LINK_RULES = {
  sharedConceptBase: 0.6,
  sharedConceptBonus: 0.2,
  sameChapter: 0.25,
  wording: 0.2,
  minimum: 0.01
};

const STOP_WORDS = new Set(("a an the and or but if then so of to in on at by for from with without into onto over under is are was were be been " +
  "being it its this that these those there their they them you your we our i he she his her as not no can could may might must should would " +
  "will shall do does did done has have had what which who whom whose when where why how than also only just each every all any some such other " +
  "another more most less same both either neither one two three first second new old very too about after before because while until again " +
  "further once here own off out up down nor per via whether still yet even ever much many few lot eg etc").split(" "));

/** All the words a question shows: prompt, code, options, pairs, steps and explanation. */
function questionText(q) {
  const parts = [q.prompt, q.code, q.text, q.explanation];
  (q.options || []).forEach(o => parts.push(o.text));
  (q.pairs || []).forEach(p => parts.push(p.item, p.match));
  (q.steps || []).forEach(s => parts.push(s));
  return parts.filter(Boolean).join(" ");
}

/** Lower-cased key terms with stop words removed and simple plural/tense endings stripped. */
export function keyTerms(question) {
  const words = questionText(question).toLowerCase().replace(/\[\[|\]\]|\|/g, " ").match(/[a-z][a-z0-9-]{2,}/g) || [];
  return words
    .map(w => w.replace(/-/g, ""))
    .filter(w => !STOP_WORDS.has(w))
    .map(w => w.replace(/(ings|ing|ed|es|s)$/, "").replace(/ies$/, "y"))
    .filter(w => w.length > 2);
}

/** Unit-length TF-IDF vectors, one Map(term -> weight) per question. */
export function tfidfVectors(questions) {
  const docs = questions.map(keyTerms);
  const docFrequency = new Map();
  docs.forEach(terms => new Set(terms).forEach(t => docFrequency.set(t, (docFrequency.get(t) || 0) + 1)));
  return docs.map(terms => {
    const counts = new Map();
    terms.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    const vector = new Map();
    let length = 0;
    counts.forEach((count, term) => {
      const weight = (1 + Math.log(count)) * Math.log(docs.length / docFrequency.get(term));
      vector.set(term, weight);
      length += weight * weight;
    });
    length = Math.sqrt(length) || 1;
    vector.forEach((w, t) => vector.set(t, w / length));
    return vector;
  });
}

export function cosine(a, b) {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let sum = 0;
  small.forEach((w, term) => { const other = large.get(term); if (other) sum += w * other; });
  return sum;
}

/** Strength of the link between two questions, given the cosine similarity of their wording. */
export function linkStrength(a, b, wordingSimilarity) {
  const shared = a.concepts.filter(c => b.concepts.includes(c)).length;
  const union = new Set([...a.concepts, ...b.concepts]).size;
  let base = 0;
  if (shared) base = LINK_RULES.sharedConceptBase + LINK_RULES.sharedConceptBonus * (shared / union);
  else if (a.chapter === b.chapter) base = LINK_RULES.sameChapter;
  const strength = Math.min(1, Math.max(LINK_RULES.minimum, base + LINK_RULES.wording * wordingSimilarity));
  return Math.round(strength * 100) / 100;
}

/** Position of the pair (i, j) in a flat upper-triangle array for n items. */
export function triangleIndex(i, j, n) {
  const [low, high] = i < j ? [i, j] : [j, i];
  return low * n - (low * (low + 1)) / 2 + (high - low - 1);
}

/** Strengths for every pair of questions, as a flat upper-triangle array. */
export function similarityMatrix(questions) {
  const vectors = tfidfVectors(questions);
  const n = questions.length;
  const strengths = new Array((n * (n - 1)) / 2);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      strengths[triangleIndex(i, j, n)] = linkStrength(questions[i], questions[j], cosine(vectors[i], vectors[j]));
    }
  }
  return strengths;
}

/**
 * Strength of each concept-to-concept link: the mean of the three strongest question links between them,
 * plus 0.1 if a question is tagged with both. Returns [conceptA, conceptB, strength] triples.
 */
export function conceptLinks(questions, concepts, strengthOf) {
  const byConcept = new Map(concepts.map(c => [c.id, questions.filter(q => q.concepts.includes(c.id))]));
  const links = [];
  for (let a = 0; a < concepts.length; a++) {
    for (let b = a + 1; b < concepts.length; b++) {
      const qa = byConcept.get(concepts[a].id), qb = byConcept.get(concepts[b].id);
      const strengths = [];
      qa.forEach(x => qb.forEach(y => { if (x.id !== y.id) strengths.push(strengthOf(x.id, y.id)); }));
      strengths.sort((x, y) => y - x);
      const top = strengths.slice(0, 3);
      const mean = top.length ? top.reduce((s, w) => s + w, 0) / top.length : 0;
      const sharedQuestion = qa.some(x => qb.includes(x));
      links.push([concepts[a].id, concepts[b].id, Math.round(Math.min(1, mean + (sharedQuestion ? 0.1 : 0)) * 100) / 100]);
    }
  }
  return links;
}
