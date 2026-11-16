/**
 * The panel beside the concept map: an overview when nothing is selected, or a concept's details.
 */

import { escapeHtml } from "../../core/text.js";
import { conceptPerformance } from "./concept-performance.js";
import { renderStudyCard } from "./study-card.js";

const WEAKEST_SHOWN = 6;
const RELATED_SHOWN = 5;

export function renderOverviewPanel(app) {
  const weakest = app.concepts
    .map(concept => ({ concept, performance: conceptPerformance(app, concept.id) }))
    .filter(entry => entry.performance.answered)
    .sort((a, b) => a.performance.average - b.performance.average)
    .slice(0, WEAKEST_SHOWN);
  return `
    <h2>Reading the map</h2>
    <p>Each dot is a concept, grouped by chapter. Its colour shows how you've done on that concept's questions so far. Dashed lines join related concepts from different chapters.</p>
    <h3>Your weakest concepts</h3>
    ${weakest.length
      ? `<ul class="weak">${weakest.map(({ concept, performance }) => `<li><button type="button" class="linkbtn" data-open-concept="${concept.id}">${escapeHtml(concept.name)}</button><span>${Math.round(performance.average * 100)}%</span></li>`).join("")}</ul>`
      : `<p class="muted">Answer some questions first. The concepts you find hardest will be listed here.</p>`}
    <p class="copyrow"><button type="button" class="linkbtn" data-act="copy-graph">Copy the question graph as JSON</button><span id="copyMsg" class="muted" role="status"></span></p>`;
}

export function renderConceptPanel(app, conceptId) {
  const concept = app.conceptById.get(conceptId);
  const performance = conceptPerformance(app, conceptId);
  const questions = app.graph.questionsFor(conceptId).map(id => app.questionById.get(id));
  const progress = performance.answered
    ? `${performance.answered} of ${performance.total} questions answered, ${Math.round(performance.average * 100)}% average`
    : `${performance.total} questions, none answered yet`;
  return `
    <div><button type="button" class="linkbtn" data-act="overview">Back to all concepts</button></div>
    <p class="small muted">Chapter ${concept.chapter}: ${escapeHtml(app.chapterById.get(concept.chapter).name)}</p>
    <h2>${escapeHtml(concept.name)}</h2>
    <p class="small ${performance.answered ? `${performance.band}-text` : "muted"}">${progress}</p>
    <p>${escapeHtml(concept.summary)}</p>
    <div><button type="button" class="btn primary" data-practise="${conceptId}">Practise this concept</button></div>
    <h3>Related concepts</h3>
    <ul class="links">${app.graph.relatedConcepts(conceptId, RELATED_SHOWN).map(([id]) => `<li><button type="button" class="linkbtn" data-open-concept="${id}">${escapeHtml(app.conceptById.get(id).name)}</button></li>`).join("")}</ul>
    <h3>Questions (${questions.length})</h3>
    ${questions.map(q => renderStudyCard(app, q)).join("")}`;
}
