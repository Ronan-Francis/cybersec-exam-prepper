/**
 * Entry point: load the data, build the shared app context, create the three modes and start the router.
 */

import { loadAppData } from "./data/load-data.js";
import { createAppContext } from "./app/context.js";
import { createRouter, bindCrossModeLinks } from "./app/router.js";
import { createQuizMode } from "./modes/quiz/quiz-mode.js";
import { createInfiniteMode } from "./modes/infinite/infinite-mode.js";
import { createStudyMode } from "./modes/study/study-mode.js";
import { $, $$ } from "./ui/dom.js";
import { escapeHtml } from "./core/text.js";

async function start() {
  const app = createAppContext(await loadAppData());
  const router = createRouter({
    modes: [createQuizMode(app), createInfiniteMode(app), createStudyMode(app)],
    tabs: $$(".modetabs button"),
    defaultMode: "quiz"
  });
  bindCrossModeLinks(router);
  router.start();
}

function showStartupError(error) {
  $("#stage").innerHTML = `<div class="page"><h2>The questions couldn't load</h2>
    <p>${escapeHtml(error.message)}</p>
    <p class="muted">If you opened index.html straight from your computer, run <code>npm start</code> and use the address it prints. Browsers won't load the question files from disk.</p></div>`;
}

start().catch(showStartupError);
