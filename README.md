# wife-exam

A browser-only exam app in Arabic (right-to-left), hosted on GitHub Pages. No
server, no build step: the files in this repo are the site. Node is only needed
to run the tests.

## Phases

| Phase | Content | Status |
|---|---|---|
| 1 | Deploy to GitHub Pages; welcome screen with photo, purple theme. Mobile layout from day 1. | Done |
| 2 | Question bank + exam screen: 15 random questions (10 multiple choice + 5 true/false), one at a time, next / previous. | Done |
| 3 | 5-minute timer (red in the last minute), auto-submit, result screen: score ring, right / wrong / unanswered counts, time taken, review of every question with the right answer and the explanation, filter all / right / wrong, try again. | Done |
| 4 | A reload or the back button resumes the running exam; keyboard and screen-reader pass; link preview for WhatsApp; automated tests that must pass before every deploy. | Done |

## Files

- `index.html`: the page; every screen is a `<section data-screen="…">`. It also holds
  the biology icon set (`<symbol id="i-…">`: heart, blood, vessels, circulation, health,
  DNA, cells, microscope, flask, trophy…), drawn for this app and used with
  `<svg><use href="#i-heart"/></svg>`.
- `css/style.css`: styles, mobile first (nearly all users are on phones), purple theme,
  light and dark colours, topic colours (`[data-topic]`). Phones get no blur behind the
  cards, so cheaper phones stay smooth.
- `images/wife.jpg`: the welcome photo and the link-preview image (square,
  640×640 px). The repo is public, so the photo is public too.
- `js/questions.js`: the question bank (40 questions: 20 multiple choice, 10
  true/false, 10 fill-in-the-blank; the format is described at the top of the file).
  Each question has a `topic` for its badge, chosen so the badge never gives the answer away.
  Fill-in-the-blank questions are answered by picking the missing words from 3 options;
  they are not used in the exam today.
- `js/app.js`: switches screens (`data-action` buttons) and runs the exam. Each
  exam takes 10 multiple choice and 5 true/false questions at random
  (`EXAM_MIX`), shuffles them and their options. The running exam is saved in the
  tab's `sessionStorage`, so a reload resumes it with the same time left; if the
  time ran out meanwhile, the result opens.
- `tests/`: Playwright tests (`*.spec.js`), their helpers and a tiny static server.
- `.github/workflows/pages.yml`: on every push to `main`, runs the tests, then
  publishes the site. Pull requests run the tests only.

Rule: every text the user sees is Arabic, with no English and no Western digits.
The tests check it.

## Run locally

```bash
npm run serve        # http://127.0.0.1:4173/ (or: python -m http.server 8000)
```

## Tests

```bash
npm install          # once; set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 to skip the browser download
npm test             # uses the installed Chrome locally, Playwright's Chromium in CI
```

They run at four sizes (phone 390×844, small phone 320×640, Android 412×915, desktop) and check:
the question bank (counts, valid answers, Arabic only), the welcome screen, the
mix of 15 different questions, next / previous, full marks, wrong and
unanswered answers with their corrections and the filters, the timer running
out (with a fake clock), try again, resuming after a reload, and the keyboard.
Every test also fails on a JavaScript error, English text on screen or
sideways scrolling.

## Deploy

1. Push to `main` on GitHub.
2. Once: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Each push runs the *Test and deploy to GitHub Pages* workflow; if the tests
   fail nothing is published (the report is attached to the failed run). The
   site is at `https://<user>.github.io/wife-exam/`.

Pages on a private repo needs a paid GitHub plan; a public repo is free.
