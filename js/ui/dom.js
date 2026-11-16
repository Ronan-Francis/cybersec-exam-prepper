/**
 * Small DOM helpers.
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isNarrowScreen() {
  return window.matchMedia("(max-width: 900px)").matches;
}

/** Smooth scrolling unless the user prefers reduced motion. */
export function scrollBehaviour() {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/** Scrolls an element back into view only if its top has scrolled off the screen. */
export function revealIfScrolledPast(element) {
  if (element && element.getBoundingClientRect().top < 0) element.scrollIntoView({ block: "start" });
}

/** Scrolls just enough to show an element, for example the feedback under a question. */
export function scrollIntoViewGently(element) {
  if (element) element.scrollIntoView({ block: "nearest", behavior: scrollBehaviour() });
}
