# Upgrades We Can Do With This Repo

A menu, not a mandate. Every item is scoped to the constraint that makes this project work: **static, no backend, no build required, deploy = push to `main`.** Effort is in focused hours; impact is judged for a student revising for the board exam on a phone.

Bug fixes already shipped (dropped questions, dead figures, broken tests, keyboard access, print clipping) are listed in `docs/AUDIT.md`; this document is about *new* capability.

---

## 1. Ranked by return on effort

| # | Upgrade | Impact | Effort | Depends on |
|---|---|---|---|---|
| U-01 | CI that tests + validates before deploy | ★★★★★ | 2 h | — |
| U-02 | Draw and publish the 82 figures in batches | ★★★★★ | 12–15 d | U-01 |
| U-03 | Search across all 14 chapters | ★★★★★ | 1 d | — |
| U-04 | Sticky table of contents + section anchors | ★★★★☆ | 4 h | — |
| U-05 | Progress + bookmarks in `localStorage` | ★★★★☆ | 4 h | — |
| U-06 | Exam mode: 17 MCQs by paper weighting, timed | ★★★★☆ | 1 d | U-05 |
| U-07 | Offline / installable (PWA) | ★★★★☆ | 1 d | — |
| U-08 | Split CSS/JS out of `index.html` | ★★★☆☆ | 1 d | — | **DONE** (this branch) |
| U-09 | Self-host fonts (or system stack) | ★★★☆☆ | 2 h | U-08 optional | **DONE** (this branch — system stack) |
| U-10 | MCQs become self-testing (reveal on answer) | ★★★☆☆ | 3 h | — |
| U-11 | Accessibility pass: headings, skip link, focus, contrast | ★★★☆☆ | 1 d | — |
| U-12 | Printable workbook (questions without answers) | ★★★☆☆ | 4 h | — |
| U-13 | Single source for exam mapping | ★★★☆☆ | 3 h | decision |
| U-14 | Per-chapter “last updated” + changelog | ★★☆☆☆ | 2 h | — |
| U-15 | Deck of flashcards / spaced repetition | ★★☆☆☆ | 2 d | U-05 |
| U-16 | Privacy-friendly usage analytics | ★☆☆☆☆ | 1 h | policy decision |

---

## 2. Engineering

### U-01 · CI that actually gates the deploy
`.github/workflows/static.yml` deploys whatever is pushed. Add a `ci` job — `npm ci`, `npm test`, `npm run validate:strict`, `npx html-validate index.html` — and make `deploy` depend on it (or split into `ci.yml` + `deploy.yml` with `workflow_run`). A red test must never reach students. Add `--strict` once the 82 planned figures are declared, so deleting a published figure fails the build.

### U-08 · Split `index.html` (no bundler) — DONE
`index.html` is now a ~90-line shell; CSS lives in `assets/css/app.css` (~1,050 lines, design system + print + reduced-motion) and JS in `assets/js/app.js` (router, renderer, quiz, sanitizer, delegated interactions) plus `assets/js/theme.js` (pre-paint accent/mode restore). Zero-build promise kept: no bundler, review diffs readable, strict CSP works because there is no inline script. Tests mount `assets/js/app.js` directly via jsdom.

### U-13 · One source for exam mapping
`manifest.exam_line` and `meta.exam_info` disagree on all 14 chapters, and ch12 contradicts itself (`Q4 · Q9(a)` vs `Q3 · Q8(b)`). Pick the manifest as the single source, delete `exam_info` from chapter meta (or generate it), and let the validator enforce equality in the interim. Students currently see two different claims about which question their chapter feeds.

### U-14 · Content provenance
Add `meta.updated` and a visible “last reviewed” line per chapter. With 108k words of AI-assisted content, students and parents deserve to know when it was checked. Pair with a short `CHANGELOG.md`.

### U-02 · Asset pipeline hygiene
Beyond drawing the figures: `normalize-svg.mjs` to reject baked backgrounds and external fonts, a size budget, and a staged `dist/` deploy so tests/docs/config stop being published (see `docs/SECURITY.md` SEC-08).

---

## 3. Study experience

### U-03 · Search
Build `chapters/search-index.json` at commit time from titles, section headings, paragraphs and questions (≈150 KB, trimmed snippets). Client-side filter with `/` to focus, keyboard navigation, and “jump to section”. For 108k words, the sidebar alone stops scaling. This is the single biggest usability gap after the figures.

### U-04 · Table of contents + anchors
Every chapter is 4–15 sections long and the only navigation is scroll. A sticky TOC rail (desktop) / collapsible list (mobile) with scroll-spy, plus real anchors (`#ch03/s3-2`) for sharing a specific derivation with a classmate. Also fixes the empty-`id` bug properly instead of just hiding it.

### U-05 · Progress and bookmarks
`localStorage` only: visited sections, last-read position, quiz best score, flagged questions. Show “12 of 34 sections read” on the chapter card. Zero backend, works offline. This turns a document into a study tool.

### U-06 · Exam mode
Generate a mock paper from the real weighting already encoded in the manifest (17 objective; 2 from Ch 1/6/10; Q2–Q4 short-question pools; Q5–Q9 long questions). Timer, no answers until submit, score by section. This is what students actually want two months before boards, and the data to build it is already there.

### U-10 · MCQs that test instead of telling
Answers are currently pre-highlighted, so an MCQ is a reading exercise. Hide the correct option until the student picks or taps “Show answer”; keep the explanation revealed afterwards. Three hours of work, materially better recall.

### U-12 · Printable workbook
Print already works well. Offer a second print mode that emits questions only (answers in an appendix), with space to write. Teachers can hand it out; students can self-test on paper.

### U-15 · Flashcards / spaced repetition
Definitions (171), equations (39) and quantum-number facts are already structured. A lightweight SM-2 scheduler over `localStorage`, 10 cards a day.

### U-07 · Offline PWA
A service worker caching `index.html`, the CSS/JS, chapter JSON and figures makes the site usable on a school bus with no data — a real constraint for the target audience. Needs U-08 and a manifest with icons. Add an “Update available” prompt rather than silent cache staleness.

---

## 4. Presentation & accessibility

### U-09 · Fonts
Three Google families, render-blocking, unavailable on filtered school networks. Self-host two woff2 subsets (≈120 KB) or go system-first. Removes a third-party request (SEC-06) and a layout-shift source.

### U-11 · Accessibility pass
Real heading levels for sections/subsections, a skip link, 44px touch targets, `aria-expanded` on nav (done for collapsibles), contrast fixes for the 9–10px purple/red labels, and a light theme honouring `prefers-color-scheme`. This overlaps with the stalled design work, but the semantic fixes stand on their own.

### U-16 · Usage analytics (optional)
If you want to know which chapters are read, use a cookieless, self-hosted counter (or GoatCounter) rather than GA. Otherwise skip — the site currently collects nothing, which is a feature.

---

## 5. Content

- **Finish the diagrams** (`docs/DIAGRAMS.md`): batch 0 wires the 7 finished ch02 assets, batch 1 covers ch03’s 20.
- **Verify the 20 “book error” claims.** Each is an assertion about the textbook; one wrong flag teaches a student the wrong correction. Add a reviewer note and a source page to each.
- **Past-paper tagging.** Tag MCQs/SQs with the year and board they came from, then add a filter “only appeared in 2023–2025”.
- **Glossary + formula sheet.** Definitions and 39 equations already exist; a generated index with jump links is cheap and high-value before exams.
- **Worked numericals.** Stoichiometry (ch04), energetics (ch06), electrochemistry (ch10) and equilibrium (ch08) are where students lose marks; step-by-step solutions with units beat prose.
- **Chapter 1 diagrams.** It has none authored, yet periodic trends are the most visual topic in the book. Add 2–3 (atomic radius, ionisation energy, electronegativity) to the backlog.

---

## 6. If you only do five things in the next month

1. **U-01 CI gate** — two hours, stops every future regression from shipping.
2. **U-02 batch 0 + 1** — wire the 7 ch02 figures, draw ch03’s 20. This is the visible difference between “notes” and “a textbook”.
3. **U-03 search** — one day, and the site becomes navigable.
4. **U-04 + U-05 TOC and progress** — half a day each; makes long chapters feel finite.
5. **U-10 MCQ reveal** — three hours; converts 175 passive facts into 175 retrieval practice moments.

Everything else is a good idea that can wait until these five are done.
