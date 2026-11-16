/**
 * Positions for the concept map. Chapters sit on a ring; each chapter's concepts cluster just outside it.
 * Label boxes are then pushed apart until none overlap. The layout is deterministic, so the map
 * looks the same on every visit.
 */

const RING = { x: 330, y: 270 };          // chapter ring radii
const CLUSTER = { x: 130, y: 115 };       // where concepts start, relative to their chapter
const CLUSTER_REST_DISTANCE = 120;        // distance concepts settle at from their chapter
const CLUSTER_PULL = 0.03;                // how strongly concepts are pulled back to their chapter
const SPREAD_PER_CONCEPT = 0.5;           // radians between concepts in a cluster
const MAX_SPREAD = 2.4;
const ITERATIONS = 700;
const GAP = { x: 6, y: 4 };               // minimum space between label boxes
const PADDING = 16;
const CROSS_LINK_MIN = 0.7;               // draw cross-chapter links at least this strong
const CROSS_LINKS_PER_CONCEPT = 2;

export function layoutConceptMap(app) {
  const hubs = placeChapterHubs(app.chapters);
  const nodes = placeConcepts(app.concepts, hubs);
  const everything = [...hubs, ...nodes];
  everything.forEach(sizeLabelBox);
  for (let i = 0; i < ITERATIONS; i++) {
    nodes.forEach(pullTowardChapter);
    separateOverlaps(everything);
  }
  everything.forEach(placeCircle);
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  return { hubs, nodes, nodeById, crossLinks: crossChapterLinks(app, nodes, nodeById), bounds: boundsOf(everything) };
}

function placeChapterHubs(chapters) {
  return chapters.map((chapter, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / chapters.length;
    return { kind: "chapter", chapter: chapter.id, lines: [chapter.short], angle, x: Math.cos(angle) * RING.x, y: Math.sin(angle) * RING.y, fixed: true };
  });
}

function placeConcepts(concepts, hubs) {
  return hubs.flatMap(hub => {
    const inChapter = concepts.filter(c => c.chapter === hub.chapter);
    const spread = Math.min(MAX_SPREAD, SPREAD_PER_CONCEPT * (inChapter.length - 1));
    return inChapter.map((concept, j) => {
      const angle = hub.angle + (inChapter.length > 1 ? -spread / 2 + (spread * j) / (inChapter.length - 1) : 0);
      return { kind: "concept", id: concept.id, chapter: concept.chapter, lines: wrapLabel(concept.name), hub, x: hub.x + Math.cos(angle) * CLUSTER.x, y: hub.y + Math.sin(angle) * CLUSTER.y };
    });
  });
}

/** Splits a label onto at most two lines, as evenly as the words allow. */
export function wrapLabel(text, maxSingleLine = 16) {
  if (text.length <= maxSingleLine) return [text];
  const words = text.split(" ");
  let best = [text], widest = Infinity;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(" "), second = words.slice(i).join(" ");
    const width = Math.max(first.length, second.length);
    if (width < widest) { widest = width; best = [first, second]; }
  }
  return best;
}

function sizeLabelBox(node) {
  const longest = Math.max(...node.lines.map(l => l.length));
  node.w = longest * (node.kind === "chapter" ? 7.6 : 6.9) + 12;
  node.h = node.kind === "chapter" ? 66 : 24 + node.lines.length * 15;
}

function pullTowardChapter(node) {
  const dx = node.x - node.hub.x, dy = node.y - node.hub.y;
  const distance = Math.hypot(dx, dy) || 1;
  const pull = (distance - CLUSTER_REST_DISTANCE) * CLUSTER_PULL;
  node.x -= (dx / distance) * pull;
  node.y -= (dy / distance) * pull;
}

/** Pushes overlapping boxes apart along the axis where they overlap least. Fixed nodes don't move. */
function separateOverlaps(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const overlapX = (a.w + b.w) / 2 + GAP.x - Math.abs(a.x - b.x);
      const overlapY = (a.h + b.h) / 2 + GAP.y - Math.abs(a.y - b.y);
      if (overlapX <= 0 || overlapY <= 0) continue;
      const shareA = a.fixed ? 0 : b.fixed ? 1 : 0.5;
      const shareB = b.fixed ? 0 : a.fixed ? 1 : 0.5;
      if (overlapX < overlapY) {
        const push = a.x < b.x ? -overlapX : overlapX;
        a.x += push * shareA; b.x -= push * shareB;
      } else {
        const push = a.y < b.y ? -overlapY : overlapY;
        a.y += push * shareA; b.y -= push * shareB;
      }
    }
  }
}

/** The circle sits at the top of each label box; cy is its centre. */
function placeCircle(node) {
  node.r = node.kind === "chapter" ? 20 : 8;
  node.cy = node.y - node.h / 2 + node.r + 2;
}

function crossChapterLinks(app, nodes, nodeById) {
  const links = [], seen = new Set();
  nodes.forEach(node => {
    app.graph.relatedConcepts(node.id, Infinity)
      .filter(([other]) => nodeById.get(other).chapter !== node.chapter)
      .slice(0, CROSS_LINKS_PER_CONCEPT)
      .forEach(([other, strength]) => {
        const key = [node.id, other].sort().join("|");
        if (strength >= CROSS_LINK_MIN && !seen.has(key)) { seen.add(key); links.push([node.id, other, strength]); }
      });
  });
  return links;
}

function boundsOf(nodes) {
  const left = Math.min(...nodes.map(n => n.x - n.w / 2)), right = Math.max(...nodes.map(n => n.x + n.w / 2));
  const top = Math.min(...nodes.map(n => n.y - n.h / 2)), bottom = Math.max(...nodes.map(n => n.y + n.h / 2));
  return { x: left - PADDING, y: top - PADDING, w: right - left + 2 * PADDING, h: bottom - top + 2 * PADDING };
}
