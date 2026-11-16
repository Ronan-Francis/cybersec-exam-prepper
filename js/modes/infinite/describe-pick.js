/**
 * The one-line explanation of why Infinite mode chose the current question.
 */

import { plural } from "../../core/text.js";

export function describePick(pick, session, app) {
  const reason = pick.reason;
  switch (reason.type) {
    case "warmup":
      return "Warm-up: questions come from across all chapters until you miss one.";
    case "explore":
      return "New ground: a question from another area, to look for other weak spots.";
    case "reask":
      return `Back again: you missed this ${plural(reason.questionsAgo, "question")} ago.`;
    case "similar": {
      const shared = app.graph.sharedConcepts(reason.from, pick.id).map(c => app.conceptById.get(c).name);
      const missedNumber = session.questionNumbers.get(reason.from);
      return `Linked to question ${missedNumber}, which you missed (link strength ${reason.strength.toFixed(2)})` +
        (shared.length ? `. Both cover ${shared.join(" and ")}.` : ".");
    }
    case "focus":
      return `Focus: ${app.conceptById.get(session.focus).name}.`;
    case "focus-near":
      return `Close to your focus concept (link strength ${reason.strength.toFixed(2)}).`;
    default:
      return "";
  }
}
