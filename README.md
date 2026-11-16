# CSSP Exam Prep

Moodle-style revision for ATU COMP09031 Cybersecurity and Secure Programming: 187 questions across 10 chapters, 56 concepts and 7 question types.

It has three modes, each with its own address (`#quiz`, `#infinite`, `#study`) so you can bookmark one:

- **Quiz**: practice attempts (check each answer as you go) or exam attempts (marked when you finish). Pick the chapters, question types and length, or use a preset (a 30-question mock exam or a quick 10). There's a Moodle-style navigation grid, a timer, a results page and a filter for questions you got wrong before.
- **Infinite**: an endless run that explains every answer. When you miss a question it follows the strongest links in the question graph to similar questions, then asks the one you missed again once three others have gone by. With no misses outstanding it draws unseen questions from the chapter you've covered least.
- **Study**: a concept map you can pan and zoom, coloured by how you've done (80% or more, 50 to 79%, below 50%, not answered). Each concept has a summary, its linked concepts, and its questions with the answers hidden until you reveal them. "Practise this concept" starts an Infinite run focused on it.

Plain HTML, CSS and JavaScript modules. There's no framework, no build step and no dependencies to install. Node is only needed for the dev server, the tests and the two generator scripts.

Your marks are kept in the browser's `localStorage` (key `cssp-exam-prep:v1`), the last mark for each question. Nothing is sent anywhere, and progress doesn't follow you to another browser or device. The page uses system fonts and makes no outside requests.

## Running it locally

You need Node 20 or later.

```sh
npm start        # serves the site at http://localhost:8080
npm test         # 30 tests: question bank rules, marking, graph, Infinite mode, single-file build
npm run graph    # rebuilds data/graph.json after you edit questions
npm run bundle   # writes dist/cssp-exam-prep.html
```

Browsers won't load the JSON data when `index.html` is opened straight from disk, so use `npm start`, or open the single-file build (see below).

To use another port, set `PORT` first: `PORT=3000 npm start` in bash, or `$env:PORT = 3000; npm start` in PowerShell.

`npm test` also rebuilds `dist/cssp-exam-prep.html`, because the bundle tests run the bundler.

`npm test` fails if `data/graph.json` is out of date with the question files, so you'll know when to run `npm run graph`.

## Publishing on GitHub Pages

The site is static and every path in it is relative, so it works from a project address like `https://<your-username>.github.io/<repository-name>/` with no configuration.

Before you start:

- On a free GitHub account, Pages only works from a **public** repository. Either way the published site is public, so the whole question bank, answers included, will be readable by anyone.
- Publish this folder (the one holding `index.html`), not its parent, so `index.html` sits at the top of the repository.

1. Check everything passes:

   ```sh
   npm test
   ```

2. Turn the folder into a Git repository and commit it. `-b main` names the branch `main`, which older Git versions don't do by default:

   ```sh
   git init -b main
   git add .
   git commit -m "CSSP Exam Prep"
   ```

   `.gitignore` keeps `dist/` and `node_modules/` out of the commit.

3. On GitHub, create a new **empty** repository. Don't tick the options to add a README, a `.gitignore` or a licence, or the first push will be rejected.

4. Connect the folder to it and push:

   ```sh
   git remote add origin https://github.com/<your-username>/<repository-name>.git
   git push -u origin main
   ```

5. In the repository, go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick `main` and `/ (root)`, and save.

6. The site appears at `https://<your-username>.github.io/<repository-name>/` after a minute or so. The Pages settings page shows the address once the first deployment finishes.

To publish a change later, commit and push to `main`. Pages redeploys on every push:

```sh
git add .
git commit -m "Describe the change"
git push
```

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are instead of running them through Jekyll.

## Single-file build

```sh
npm run bundle   # writes dist/cssp-exam-prep.html (about 450 KB)
```

This writes one HTML file with the CSS, data and code inlined. It opens straight from disk and works offline, so you can email it or put it on a USB stick. `dist/` is in `.gitignore`, so it isn't published with the site. Rebuild it whenever the questions or code change.

## How the code is organised

```
index.html                 page shell: header, mode tabs, side panel, main stage
css/                       one stylesheet per area (tokens, base, layout, question, quiz, infinite, study)
data/
  chapters.json            the ten chapters, each pointing at its question file
  concepts.json            56 concepts, each with a chapter, a name and a short summary
  questions/*.json         the questions, one file per chapter
  graph.json               generated link strengths (npm run graph)
js/
  main.js                  entry point: loads data, creates the modes, starts the router
  app/                     shared app context and the hash router (#quiz, #infinite, #study)
  core/                    logic with no DOM: attempts and marking, the graph, Infinite's picker, text helpers
  question-types/          one module per question type, all with the same interface
  storage/                 saved answer history (localStorage)
  data/                    loading the JSON, or the inlined copy in the single-file build
  ui/                      shared rendering: question card, feedback, input binding, DOM helpers
  modes/quiz|infinite|study/  each mode split into setup, pages, side panel and state
tools/                     dev server, graph builder, single-file bundler, shared file helpers
tests/                     node:test suites, plus shared helpers
```

The dependencies run one way: `modes` use `ui`, `core` and `question-types`, and `core` never touches the DOM. Each mode is an object `{ name, enter(params), leave() }`. The router calls `leave()` on the old mode, which removes that mode's listeners through an `AbortController`, and then `enter()` on the new one.

### Question types

Each type in `js/question-types/` implements the interface documented in `index.js`: a `name` and `label`, then `prepare`, `emptyResponse`, `isAnswered`, `grade`, `renderInput`, `readInput`, `renderCorrect`, `listMistakes` and `renderPreview`. `handleClick` is optional, for types driven by buttons such as ordering. Nothing else in the app checks a question's type. To add a type, write a module with those functions and add it to `QUESTION_TYPES`.

## Adding or editing questions

Questions live in `data/questions/NN-chapter.json`. Every question has an `id` (chapter number, a hyphen, then a two-digit number), a `chapter`, a `type`, 1 to 3 `concepts` from `data/concepts.json`, a `prompt` and an `explanation`:

```json
{
  "id": "2-99",
  "chapter": 2,
  "type": "multiple-choice",
  "concepts": ["stride"],
  "prompt": "Which STRIDE category covers a user denying they made a change?",
  "options": [
    { "text": "Repudiation", "correct": true },
    { "text": "Tampering", "why": "Tampering is changing data, not denying an action." }
  ],
  "explanation": "Repudiation threats are about missing evidence of who did what."
}
```

The type-specific fields are:

| Type | Fields |
| --- | --- |
| `multiple-choice` | `options`: exactly one has `"correct": true`, the rest have a `why` |
| `multiple-response` | `options`: some but not all are correct, every wrong one has a `why` |
| `true-false` | `answer`: `true` or `false` |
| `matching` | `pairs`: `[{ "item", "match", "why"? }]`, at least two, with distinct items (matches may repeat) |
| `ordering` | `steps`, in the correct order |
| `missing-words` | `text` with blanks written `[[right answer\|wrong\|wrong]]`, the right answer first |
| `short-answer` | `accept`: the accepted answers (case, hyphens, a leading "a", "an" or "the" and a trailing full stop are ignored) |

Code goes in an optional `code` field. After editing, run `npm run graph` to rebuild the links, then `npm test`. The bank tests enforce the content rules:

- unique ids, a known chapter and a known type
- 1 to 3 known concepts per question, and every concept used by at least one question
- every wrong option explains why it's wrong
- no em dashes
- no references to the lecture or slides
- code named in a prompt has to appear in the question
- no fine internals the exam won't ask about
- the correct multiple-choice option is the longest in at most 40% of questions, and the shortest in at most 40%
- between 35% and 65% of true/false answers are True

## The question graph

`tools/build-graph.js` links every question to its concepts (strength 1), every concept to its chapter, and every question to every other question:

- 0.6, plus up to 0.2 for overlapping concepts, when two questions share a concept
- 0.25 when they share only a chapter
- plus up to 0.2 for shared wording (TF-IDF cosine similarity)
- clamped to between 0.01 and 1, so every pair is linked

The question links are stored as a flat upper triangle in `data/graph.json`, 17,391 of them for 187 questions. The same file holds the concept-to-concept links that Study mode draws: the average of the three strongest question links between two concepts, plus 0.1 if a question is tagged with both. The rules live in `js/core/similarity.js`, and the Study overview has a button that copies the whole graph as JSON.

## Conventions

- Small modules with one job each, named for what they do. A file over about 170 lines is a sign it should be split.
- Imports are single-line named imports. Exports are declarations: `export function` and `export const`, with no default exports. The bundler relies on both and fails with an error if a file breaks them.
- Rendering functions return HTML strings, and any user or data text goes through `escapeHtml` or `formatInline`.
- No em dashes in questions or UI text.
