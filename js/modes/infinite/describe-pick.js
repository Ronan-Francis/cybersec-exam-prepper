/**
 * The one-line explanation of why Infinite mode chose the current question.
 */

import { plural } from "../../core/text.js";

export function describePick(pick, session, app) {
  const reason = pick.reason;
  switch (reason.type) {
    case "warmup":
      return "A mix from every chapter until you get one wrong.";
    case "explore":
      return "From a different area, to check for other gaps.";
    case "reask":
      return `You got this wrong ${plural(reason.questionsAgo, "question")} ago.`;
    case "similar": {
      const shared = app.graph.sharedConcepts(reason.from, pick.id).map(c => app.conceptById.get(c).name);
      const missedNumber = session.questionNumbers.get(reason.from);
      return `Similar to question ${missedNumber}, which you got wrong.` + (shared.length ? ` Both are about ${shared.join(" and ")}.` : "");
    }
    case "focus":
      return `You asked to practise ${app.conceptById.get(session.focus).name}.`;
    case "focus-near":
      return `Closely related to ${app.conceptById.get(session.focus).name}, which you asked to practise.`;
    default:
      return "";
  }
}
