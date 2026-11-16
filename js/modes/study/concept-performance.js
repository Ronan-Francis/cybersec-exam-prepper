/**
 * How well the user has done on a concept, from every answer saved on this browser (any mode).
 */

const GOOD_FROM = 0.8;
const PART_FROM = 0.5;

/** { total, answered, average (0..1 or null), band: "good" | "part" | "bad" | "none" } */
export function conceptPerformance(app, conceptId) {
  const ids = app.graph.questionsFor(conceptId);
  const scores = ids.map(id => app.history.lastScore(id)).filter(score => score !== null);
  const average = scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;
  let band = "none";
  if (average !== null) band = average >= GOOD_FROM ? "good" : average >= PART_FROM ? "part" : "bad";
  return { total: ids.length, answered: scores.length, average, band };
}
