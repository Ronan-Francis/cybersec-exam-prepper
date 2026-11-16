/**
 * An attempt is one sitting of one question: its shuffled view, the user's response and,
 * once checked, the mark. All type-specific work is delegated to the question type.
 */

import { getQuestionType } from "../question-types/index.js";

/** Marks at or above this count as fully right (allows for floating-point rounding). */
const FULL_MARKS = 0.999;

export function createAttempt(question, random = Math.random) {
  const type = getQuestionType(question.type);
  const view = type.prepare(question, random);
  return {
    question,
    view,
    response: type.emptyResponse(question, view, random),
    touched: false,
    checked: false,
    score: null,
    flagged: false
  };
}

export function isAnswered(attempt) {
  return getQuestionType(attempt.question.type).isAnswered(attempt);
}

/** Marks the attempt and locks it. Returns the mark. */
export function checkAttempt(attempt) {
  if (!attempt.checked) {
    attempt.score = getQuestionType(attempt.question.type).grade(attempt.question, attempt.response);
    attempt.checked = true;
  }
  return attempt.score;
}

export function isFullMarks(score) {
  return score >= FULL_MARKS;
}

/** Turns a mark into a band used for colours: "good", "part" or "bad" ("" before marking). */
export function markBand(score) {
  if (score === null || score === undefined) return "";
  if (score >= FULL_MARKS) return "good";
  if (score <= 0.001) return "bad";
  return "part";
}

/** Human wording for a band, for screen readers and summaries. */
export function bandWord(band) {
  return { good: "correct", part: "partially correct", bad: "incorrect" }[band] || "";
}
