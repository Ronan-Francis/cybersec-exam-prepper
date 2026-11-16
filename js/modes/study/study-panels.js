/**
 * The panel beside the concept map: an overview when nothing is selected, or a concept's details.
 */

import { escapeHtml, pad2 } from "../../core/text.js";
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
  const counts = app.graph.counts;
  const stat = (label, value) => `<div><dt>${label}</dt><dd>${value.toLocaleString("en-IE")}</dd></div>`;
  return `
    <h2>Study mode</h2>
    <p>Each dot is a concept, grouped around its chapter. Colours come from every answer saved on this browser, in any mode. Dashed lines join closely related concepts in different chapters.</p>
    <h3>Weakest concepts so far</h3>
    ${weakest.length
      ? `<ul class="weak">${weakest.map(({ concept, performance }) => `<li><button type="button" class="linkbtn" data-open-concept="${concept.id}">${escapeHtml(concept.name)}</button><span>${Math.round(performance.average * 100)}%</span></li>`).join("")}</ul>`
      : `<p class="muted small">Answer some questions in any mode and your weak spots will show here.</p>`}
    <h3>The graph behind it</h3>
    <dl class="graph-stats">
      ${stat("Chapters", counts.chapters)}${stat("Concepts", counts.concepts)}${stat("Questions", counts.questions)}
      ${stat("Question-to-topic links", counts.topicLinks)}${stat("Question-to-question links", counts.questionLinks)}${stat("Concept-to-concept links", counts.conceptLinks)}
    </dl>
    <p class="small muted">Each question links to its concepts with strength 1. Every pair of questions is linked: 0.6 to 0.8 when they share a concept, 0.25 when they share only a chapter, plus up to 0.2 for shared wording. Infinite mode follows the strongest links from the questions you miss.</p>
    <div class="copyrow"><button type="button" class="btn ghost" data-act="copy-graph">Copy graph data (JSON)</button><span id="copyMsg" class="small muted" role="status"></span></div>`;
}

export function renderConceptPanel(app, conceptId) {
  const concept = app.conceptById.get(conceptId);
  const performance = conceptPerformance(app, conceptId);
  const questions = app.graph.questionsFor(conceptId).map(id => app.questionById.get(id));
  const progress = performance.answered
    ? `${performance.answered} of ${performance.total} questions answered · average ${Math.round(performance.average * 100)}%`
    : `${performance.total} questions · none answered yet`;
  return `
    <div class="panel-top"><button type="button" class="linkbtn" data-act="overview">← All concepts</button></div>
    <p class="kicker">Ch ${pad2(concept.chapter)} · ${escapeHtml(app.chapterById.get(concept.chapter).short)}</p>
    <h2>${escapeHtml(concept.name)}</h2>
    <p class="perfline ${performance.band}">${progress}</p>
    <p class="summary">${escapeHtml(concept.summary)}</p>
    <button type="button" class="btn primary" data-practise="${conceptId}">Practise this concept</button>
    <h3>Linked concepts</h3>
    <ul class="links">${app.graph.relatedConcepts(conceptId, RELATED_SHOWN).map(([id, strength]) => relatedRow(app, id, strength)).join("")}</ul>
    <h3>Questions (${questions.length})</h3>
    ${questions.map(q => renderStudyCard(app, q)).join("")}`;
}

function relatedRow(app, conceptId, strength) {
  return `<li><button type="button" class="linkbtn" data-open-concept="${conceptId}">${escapeHtml(app.conceptById.get(conceptId).name)}</button>` +
    `<span class="meter" aria-hidden="true"><span style="width:${Math.round(strength * 100)}%"></span></span><span class="w">${strength.toFixed(2)}</span></li>`;
}
