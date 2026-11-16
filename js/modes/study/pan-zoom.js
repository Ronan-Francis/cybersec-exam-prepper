/**
 * Drag to pan, scroll or buttons to zoom, and tap or Enter to select a concept on the map.
 * The view is the SVG viewBox: { x, y, w, h } in map units.
 */

const DRAG_THRESHOLD = 4;     // pixels a pointer must move before a tap becomes a drag
const WHEEL_ZOOM = 0.85;
const MIN_ZOOM = 0.22;        // smallest view width, as a share of the whole map
const MAX_ZOOM = 1.6;

export function applyView(svg, view) {
  svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);
}

/** Returns a new view zoomed by factor around the point (cx, cy), or around the centre. */
export function zoomView(view, bounds, factor, cx = view.x + view.w / 2, cy = view.y + view.h / 2) {
  const w = Math.min(bounds.w * MAX_ZOOM, Math.max(bounds.w * MIN_ZOOM, view.w * factor));
  const k = w / view.w;
  return { x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w, h: view.h * k };
}

/**
 * getView/setView read and replace the current view; onSelect(conceptId) fires on a tap or Enter.
 * Pass an AbortSignal to remove the listeners.
 */
export function attachPanZoom(svg, { getView, setView, bounds, onSelect, signal }) {
  let drag = null;
  const options = { signal };

  svg.addEventListener("pointerdown", event => {
    drag = { x: event.clientX, y: event.clientY, start: { ...getView() }, moved: 0, node: event.target.closest("[data-concept]") };
    svg.setPointerCapture(event.pointerId);
  }, options);

  svg.addEventListener("pointermove", event => {
    if (!drag) return;
    const box = svg.getBoundingClientRect();
    const view = getView();
    const unitsPerPixel = Math.max(view.w / box.width, view.h / box.height);
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.moved <= DRAG_THRESHOLD) return;
    svg.classList.add("panning");
    setView({ ...view, x: drag.start.x - dx * unitsPerPixel, y: drag.start.y - dy * unitsPerPixel });
  }, options);

  svg.addEventListener("pointerup", () => {
    if (!drag) return;
    const { moved, node } = drag;
    drag = null;
    svg.classList.remove("panning");
    if (moved <= DRAG_THRESHOLD && node) onSelect(node.dataset.concept);
  }, options);

  svg.addEventListener("pointercancel", () => { drag = null; svg.classList.remove("panning"); }, options);

  svg.addEventListener("wheel", event => {
    event.preventDefault();
    const point = toMapPoint(svg, event);
    setView(zoomView(getView(), bounds, event.deltaY < 0 ? WHEEL_ZOOM : 1 / WHEEL_ZOOM, point.x, point.y));
  }, { passive: false, signal });

  svg.addEventListener("keydown", event => {
    const node = event.target.closest && event.target.closest("[data-concept]");
    if (node && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onSelect(node.dataset.concept);
    }
  }, options);
}

function toMapPoint(svg, event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}
