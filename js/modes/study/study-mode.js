/**
 * Study mode: the concept map beside a panel that explains the selected concept and lists its questions
 * with the answers hidden until revealed.
 */

import { $, isNarrowScreen, scrollBehaviour } from "../../ui/dom.js";
import { layoutConceptMap } from "./concept-map-layout.js";
import { renderConceptMap } from "./concept-map-svg.js";
import { attachPanZoom, applyView, zoomView } from "./pan-zoom.js";
import { renderOverviewPanel, renderConceptPanel } from "./study-panels.js";

const BUTTON_ZOOM = 0.75;

export function createStudyMode(app) {
  const { stage } = app.elements;
  let layout = null;   // computed on first visit
  let view = null;     // current viewBox
  let selected = null; // concept id or null
  let listeners = null;

  function renderPage() {
    stage.innerHTML = `
      <div class="study">
        <section class="study-map" aria-labelledby="maph">
          <div class="map-bar">
            <h2 id="maph">Concept map</h2>
            <ul class="legend" aria-label="Colour key">
              <li><i class="lg good"></i>80% or more</li><li><i class="lg part"></i>50 to 79%</li><li><i class="lg bad"></i>Below 50%</li><li><i class="lg none"></i>Not answered</li>
            </ul>
            <div class="zoom" role="group" aria-label="Zoom">
              <button type="button" class="btn" data-zoom="in" aria-label="Zoom in">+</button><button type="button" class="btn" data-zoom="out" aria-label="Zoom out">−</button><button type="button" class="btn" data-zoom="fit">Fit</button>
            </div>
          </div>
          <svg id="graphSvg" role="group" aria-label="Concept map: ten chapters with their concepts" preserveAspectRatio="xMidYMid meet">${renderConceptMap(app, layout, selected)}</svg>
          <p class="map-hint">Select a concept to study it. Drag to move the map and scroll to zoom.</p>
        </section>
        <aside class="block study-panel" id="studyPanel" aria-live="polite">${panelHtml()}</aside>
      </div>`;
    const svg = $("#graphSvg");
    applyView(svg, view);
    attachPanZoom(svg, { getView: () => view, setView, bounds: layout.bounds, onSelect: select, signal: listeners.signal });
  }

  const panelHtml = () => (selected ? renderConceptPanel(app, selected) : renderOverviewPanel(app));

  function setView(next) {
    view = next;
    applyView($("#graphSvg"), view);
  }

  /** Selects a concept (or null for the overview) without redrawing the whole page. */
  function select(conceptId) {
    selected = conceptId;
    const keyboardOnMap = document.activeElement?.closest?.("#graphSvg");
    $("#graphSvg").innerHTML = renderConceptMap(app, layout, selected);
    const panel = $("#studyPanel");
    panel.innerHTML = panelHtml();
    panel.scrollTop = 0;
    if (selected && keyboardOnMap) $(`#graphSvg [data-concept="${selected}"]`)?.focus();
    if (selected && isNarrowScreen()) panel.scrollIntoView({ block: "start", behavior: scrollBehaviour() });
  }

  async function copyGraph() {
    const { json, nodeCount, edgeCount } = app.graph.toJson();
    const message = $("#copyMsg");
    try {
      await navigator.clipboard.writeText(json);
      message.textContent = `Copied ${nodeCount} nodes and ${edgeCount.toLocaleString("en-IE")} links.`;
    } catch {
      message.textContent = "Your browser didn't allow the copy.";
    }
  }

  function handleClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.openConcept) return select(button.dataset.openConcept);
    if (button.dataset.zoom === "fit") return setView({ ...layout.bounds });
    if (button.dataset.zoom) return setView(zoomView(view, layout.bounds, button.dataset.zoom === "in" ? BUTTON_ZOOM : 1 / BUTTON_ZOOM));
    if (button.dataset.act === "overview") return select(null);
    if (button.dataset.act === "copy-graph") return copyGraph();
  }

  return {
    name: "study",
    /** params.concept: a concept id to open, null for the overview, or undefined to keep the last selection. */
    enter(params = {}) {
      layout ||= layoutConceptMap(app);
      view ||= { ...layout.bounds };
      if (params.concept !== undefined) selected = params.concept;
      listeners = new AbortController();
      stage.addEventListener("click", handleClick, { signal: listeners.signal });
      renderPage();
    },
    leave() {
      listeners.abort();
    }
  };
}
