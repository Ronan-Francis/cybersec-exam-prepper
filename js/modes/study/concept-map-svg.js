/**
 * Draws the concept map as SVG: chapter hubs, concept dots coloured by performance, and links.
 * With a concept selected, everything except it and its closest concepts is dimmed.
 */

import { escapeHtml, pad2 } from "../../core/text.js";
import { conceptPerformance } from "./concept-performance.js";

const RELATED_SHOWN = 5;
const n1 = value => value.toFixed(1);

export function renderConceptMap(app, layout, selected) {
  const related = selected ? app.graph.relatedConcepts(selected, RELATED_SHOWN).map(([id]) => id) : [];
  const isDimmed = id => selected && id !== selected && !related.includes(id);
  return `<g class="g-edges">${chapterLinks(layout, selected)}${conceptLinks(layout, selected, related)}</g>` +
    `<g class="g-nodes">${layout.hubs.map(hub => chapterHub(hub, selected)).join("")}` +
    `${layout.nodes.map(node => conceptNode(app, node, selected, isDimmed(node.id))).join("")}</g>`;
}

function chapterLinks(layout, selected) {
  return layout.nodes.map(node =>
    `<line class="g-link${selected && node.id !== selected ? " dim" : ""}" x1="${n1(node.hub.x)}" y1="${n1(node.hub.cy)}" x2="${n1(node.x)}" y2="${n1(node.cy)}"/>`).join("");
}

/** With nothing selected: faint cross-chapter links. With a selection: its closest concepts, highlighted. */
function conceptLinks(layout, selected, related) {
  if (selected) return related.map(id => `<path class="g-cross on" d="${curve(layout.nodeById.get(selected), layout.nodeById.get(id))}"/>`).join("");
  return layout.crossLinks.map(([a, b]) => `<path class="g-cross" d="${curve(layout.nodeById.get(a), layout.nodeById.get(b))}"/>`).join("");
}

/** A gentle curve bowed towards the centre of the map. */
function curve(a, b) {
  const controlX = ((a.x + b.x) / 2) * 0.55, controlY = ((a.cy + b.cy) / 2) * 0.55;
  return `M${n1(a.x)} ${n1(a.cy)} Q${n1(controlX)} ${n1(controlY)} ${n1(b.x)} ${n1(b.cy)}`;
}

function chapterHub(hub, selected) {
  return `<g class="g-hub${selected ? " dim" : ""}" transform="translate(${n1(hub.x)} ${n1(hub.cy)})">` +
    `<circle r="${hub.r}"/><text class="hub-num" dy="4.5">${pad2(hub.chapter)}</text><text class="hub-label" y="38">${escapeHtml(hub.lines[0])}</text></g>`;
}

function conceptNode(app, node, selected, dimmed) {
  const performance = conceptPerformance(app, node.id);
  const concept = app.conceptById.get(node.id);
  const summary = performance.answered
    ? `${Math.round(performance.average * 100)}% across ${performance.answered} of ${performance.total} questions answered`
    : `${performance.total} questions, none answered yet`;
  const classes = ["g-c", performance.band, node.id === selected ? "sel" : "", dimmed ? "dim" : ""].filter(Boolean).join(" ");
  const label = node.lines.map((line, i) => `<text y="${22 + i * 15}">${escapeHtml(line)}</text>`).join("");
  return `<g class="${classes}" data-concept="${node.id}" role="button" tabindex="0" aria-label="${escapeHtml(`${concept.name}: ${summary}`)}" transform="translate(${n1(node.x)} ${n1(node.cy)})">` +
    `<circle r="${node.r}"/>${label}</g>`;
}
