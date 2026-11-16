/**
 * Registry of question types.
 *
 * Every type implements the same interface, so the rest of the app never switches on type:
 *   name, label
 *   prepare(question, random)              -> view state, such as a shuffled option order
 *   emptyResponse(question, view, random)  -> the response before the user answers
 *   isAnswered(attempt)                    -> has the user given an answer yet?
 *   grade(question, response)              -> mark from 0 to 1
 *   renderInput(attempt, { locked, reveal, key }) -> HTML for the answer controls
 *   readInput(attempt, inputElement)       -> updates the response from a changed input; true if handled
 *   handleClick(attempt, button)           -> optional; for button-driven types such as ordering
 *   renderCorrect(question)                -> HTML showing the correct answer
 *   listMistakes(attempt)                  -> HTML strings explaining what the user got wrong
 *   renderPreview(question)                -> HTML for Study mode, with the answer hidden
 */

import { multipleChoice } from "./multiple-choice.js";
import { multipleResponse } from "./multiple-response.js";
import { trueFalse } from "./true-false.js";
import { matching } from "./matching.js";
import { ordering } from "./ordering.js";
import { missingWords } from "./missing-words.js";
import { shortAnswer } from "./short-answer.js";

/** All types, in the order they're listed in the setup panel. */
export const QUESTION_TYPES = [multipleChoice, multipleResponse, trueFalse, matching, ordering, missingWords, shortAnswer];

const TYPES_BY_NAME = new Map(QUESTION_TYPES.map(type => [type.name, type]));

/** Looks up a question type by name, for example "matching". */
export function getQuestionType(name) {
  const type = TYPES_BY_NAME.get(name);
  if (!type) throw new Error(`Unknown question type: ${name}`);
  return type;
}
