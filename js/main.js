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
  showBankStats(app);
  const router = createRouter({
    modes: [createQuizMode(app), createInfiniteMode(app), createStudyMode(app)],
    tabs: $$(".modetabs button"),
    defaultMode: "quiz"
  });
  bindCrossModeLinks(router);
  router.start();
}

function showBankStats(app) {
  $("#statQuestions").textContent = app.questions.length;
  $("#statChapters").textContent = app.chapters.length;
  $("#statTypes").textContent = new Set(app.questions.map(q => q.type)).size;
}

function showStartupError(error) {
  $("#stage").innerHTML = `<article class="qcard"><h2>The questions couldn't load</h2>
    <p>${escapeHtml(error.message)}</p>
    <p class="muted">If you opened index.html straight from your computer, run <code>npm start</code> and open the address it prints instead. Browsers block loading data from local files.</p></article>`;
}

start().catch(showStartupError);
