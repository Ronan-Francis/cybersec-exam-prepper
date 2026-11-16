/**
 * Building blocks of a question card, shared by every mode.
 */

import { escapeHtml, formatInline, pad2 } from "../core/text.js";
import { getQuestionType } from "../question-types/index.js";

/** Chapter and question-type tags. */
export function renderTags(question, chapterById) {
  const chapter = chapterById.get(question.chapter);
  return `<span class="tag ch">Ch ${pad2(question.chapter)} · ${escapeHtml(chapter.short)}</span>` +
    `<span class="tag type">${getQuestionType(question.type).label}</span>`;
}

/** The prompt, followed by its code block if it has one. Only the current question gets the id. */
export function renderPrompt(question, { withId = false } = {}) {
  return `<div class="qtext"${withId ? ' id="qtext"' : ""}>${formatInline(question.prompt)}</div>${renderCode(question)}`;
}

export function renderCode(question) {
  if (!question.code) return "";
  return `<div class="codewrap"><pre class="codeblock"><code>${escapeHtml(question.code)}</code></pre></div>`;
}

/**
 * The answer controls. Once an attempt is checked they are locked and show right and wrong marks.
 * key must be unique on the page; it names radio groups and input ids.
 */
export function renderAnswerArea(attempt, { key, current = true }) {
  const controls = getQuestionType(attempt.question.type).renderInput(attempt, { locked: attempt.checked, reveal: attempt.checked, key });
  return `<div class="answer"${current ? ' id="answer"' : ""}>${controls}</div>`;
}

/** The keyboard shortcut line under a question. */
export function renderKeyHints(enterAction, { flag = false } = {}) {
  return `<p class="keys">Keys: <kbd>1</kbd>–<kbd>9</kbd> choose an option · <kbd>Enter</kbd> ${enterAction}${flag ? " · <kbd>F</kbd> flag" : ""}</p>`;
}
