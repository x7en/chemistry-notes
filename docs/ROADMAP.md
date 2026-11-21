# Improvement Roadmap

Companion to `docs/AUDIT.md` (defects) and `docs/DIAGRAMS.md` (figure system).
Target: same product — a zero-build static study site on GitHub Pages — with the bugs gone, the UI composed instead of decorated, and every figure actually present.

**Guiding constraints**

- Keep it static: no framework, no runtime dependency, deploy = push.
- Content stays data (`chapters/*.json`), not markup inside `index.html`.
- Every quality claim must be machine-checkable (tests, schema, CI gate).
- Never redesign and re-architect in the same step — fix truth first, then structure, then surface.

---

## Phase 0 — Stop the bleeding
*Effort: ½ day · Risk: low · Blocks everything else*

| # | Task | Acceptance |
|---|---|---|
| 0.1 | Fix `ch12.json`: `saqs` → `sqs` | Ch12 renders 12 short questions; validator clean |
| 0.2 | Decide and enforce one diagram path convention (`assets/diagrams/chXX/chXX_<slug>.svg`), rewrite the 82 refs, lowercase the folder | All refs point at the convention; validator reports them as *missing* rather than *malformed* |
| 0.3 | Restore the test harness: commit `app-inline.js` **or** replace the harness with real extraction (preferred, see 1.1) | `npm test` runs ≥15 tests, green |
| 0.4 | Fix BUG-04: build the figure fallback with DOM APIs, not `innerHTML` in `onerror`; escape captions/alt | Caption with `<` and `"` renders as text |
| 0.5 | Fix BUG-05 (sticky topbar), BUG-06 (quiz score reset), BUG-11 (empty ids), BUG-14 (`res.ok`) | Manual mobile check; restart shows `0 / n` |
| 0.6 | Derive sidebar deleted-range and footer counts from `manifest.json`; unify the three “long questions” numbers (BUG-07/08) | No hardcoded chapter counts anywhere |
| 0.7 | Reconcile `exam_line` (manifest) vs `meta.exam_info` — pick **one** source, resolve ch02/ch06/ch12/ch14 conflicts (BUG-09/10) | Validator enforces equality or single source |
| 0.8 | Add `meta description`, `theme-color`, `color-scheme`, favicon (inline SVG), `404.html`, LICENSE, `.nojekyll` | Lighthouse SEO ≥ 95; no 404s in console |
| 0.9 | Delete `chapters/temp`; rewrite README to match reality (14 chapters, all block types, diagram contract) | README documents `qc`, `diagram`, `quiz`, `section.id` |

**Exit criteria:** `npm test` green, `node scripts/validate-content.mjs` shows only diagram-missing errors, and no chapter silently drops content.

---

## Phase 1 — Structure, truth, and gates
*Effort: 1–2 days · Risk: medium (mechanical) · Prerequisite for any UI work*

### 1.1 Split the monolith (no bundler)

```
index.html            markup + <link>/<script type=module>
assets/css/tokens.css theme tokens only
assets/css/base.css   reset, type, layout
assets/css/content.css blocks
assets/css/questions.css
assets/css/print.css
assets/js/app.js      init, router, store
assets/js/render.js   chapter/section/block renderers
assets/js/quiz.js
assets/js/ui.js       sidebar, collapsibles, theme
content/schema.json   JSON Schema for chXX.json + manifest
```

- Native ES modules; `type="module"`; no build step.
- Kills the `app-inline.js` sync hack permanently; tests import the same modules the browser uses (`jsdom` + `import()`).
- Keep a single `<script type="module" src="assets/js/app.js">` in `index.html`.

### 1.2 Schema + validator + CI gate

- `content/schema.json` — required fields per block type, enum of types, diagram path pattern, `sqs`/`saqs` ban, MCQ answer range, manifest↔meta invariants.
- `scripts/validate-content.mjs` (already added) as the fast, dependency-free gate; JSON Schema as the strict one.
- `.github/workflows/ci.yml`: on PR + push → `npm ci`, `npm test`, `npm run validate:strict`, `npx html-validate index.html`. Deploy workflow gains `needs: ci` / or use a single workflow with `test → deploy` jobs. **A red test must block the deploy.**

### 1.3 Router and data-layer hardening

- `AbortController` + request sequencing; abandoned responses discarded.
- In-memory `Map<id, chapterData>` cache; prefetch on sidebar hover/focus.
- Explicit error states: network, 404, parse, render — with a retry button.
- `scroll-margin-top` + per-section anchors (`#ch03/s3-2`), hash parsing kept backward-compatible.
- Restore scroll position on back/forward; `history.scrollRestoration`.

### 1.4 Test coverage worth having

- Golden-file render of **all 14 chapters** from disk → assert: no block throws, no `undefined`/`NaN`/`[object Object]` in output, every figure resolves, every chapter has ≥1 MCQ and ≥1 SQ.
- Unit: router (valid/invalid/stale hash), quiz scoring/reset, toggles, manifest derivation.
- A11y smoke: `axe-core` in jsdom on home + ch01 + ch03 (fails on serious violations).
- Visual: Playwright screenshots of home/chapter/print at 3 widths (optional Phase 3).

**Exit criteria:** CI runs tests + validator on every push; deploy blocked on failure; `index.html` under ~120 lines.

---

## Phase 2 — Deslop the UI
*Effort: 2–4 days · Risk: medium · Blocked on `design.md`*

### 2.1 What “slop” means here (and the fix)

| Symptom | Current | Target |
|---|---|---|
| Colour noise | 46 hex, 8 accents | 1 accent + 4 semantic + neutrals; ≤ 18 hex total |
| Rainbow callouts | 6 brands of bordered box | **One** `Callout` primitive, 4 variants by *meaning* (note, caution, exam, error) |
| Micro type | 43 sizes < 12px | Min 12px for labels, 13px metadata, 17–18px body, scale of 5 steps |
| Fonts | 3 families, 6 weights, remote | 2 families max, self-hosted or system stack, 4 weights |
| Card-in-card | borders inside borders | One elevation level; flat sections, cards only for interactive items |
| Emoji icons | ~1,600 instances | Zero. Typographic labels + 6 SVG icons if truly needed |
| Radius | 9 values | 2 values (4px controls, 8px containers) |
| Spacing | ad-hoc | 4px base: 4/8/12/16/24/32/48/64 |
| Hierarchy | everything highlighted | Reading order: heading → body → supporting note; emphasis by weight/space, not colour |

### 2.2 Proposed baseline (adopt as `design.md` if none exists)

**Direction:** *quiet editorial* — a well-set textbook page, not a dashboard. Dark-first is fine, but content contrast comes from typography and whitespace, with colour reserved for meaning.

**Type**
- UI/body sans: `Inter` (self-hosted woff2, 2 weights) or system stack.
- Reading/display serif: `Source Serif 4` (400/600) for chapter titles and body copy.
- Mono: system `ui-monospace` — equations only, never labels under 12px.
- Scale: 12 / 13 / 15 / 17 / 20 / 28 / 40. Line heights 1.45 (UI) / 1.7 (prose). Measure 66–72ch.

**Colour (dark)**
```
--surface-0 #0b0d10   --surface-1 #12151a   --surface-2 #191d24
--border    #242a33   --border-strong #333b47
--text-1    #e6eaf0   --text-2 #a8b3c1   --text-3 #7d8795
--accent    #c9a227   (one accent)
--ok #4ea87a  --warn #d08a3a  --danger #cf5c5c  --info #5b93c9
```
Light mode mirrors these; `prefers-color-scheme` + explicit toggle, `color-scheme` set, no FOUC.

**Components**
`PageHeader` · `SectionHeader` (real `<h2>/<h3>`, anchor link) · `Prose` (p/ul/ol/strong) · `Callout` (note/caution/exam/error) · `Definition` (term + body, no box) · `Equation` · `Table` · `Figure` (see diagrams doc) · `Question` (MCQ with reveal, SQ collapsible, LQ) · `Quiz` · `TOC` · `Sidebar`.

**Interaction rules**
- Every control is a real `<button>`/`<a>`; visible focus ring `2px` accent at 2px offset.
- `aria-expanded` on collapsibles; `aria-live="polite"` for quiz score.
- Reduced-motion honoured.
- MCQ: answer hidden until “Show answer” (or answered), keyboard-selectable options.

### 2.3 Execution order
1. Tokens + type scale on the current DOM (no markup change) → instant 60% improvement, easy to review.
2. Replace the 6 callouts with `Callout`; delete per-type colour CSS.
3. Question components (MCQ reveal, SQ/QC → one `<details>`-based primitive).
4. Reading chrome: TOC rail, section anchors, reading progress, skip link.
5. Sidebar/mobile nav (focus trap, ≤44px targets).
6. Theme toggle + light mode; verify against print.
7. Print CSS rewritten on top of tokens; drop the 89 `!important`s.

**Acceptance:** axe-core 0 serious; all text ≥ 4.5:1 at rendered size; no emoji; ≤ 18 hex tokens; one callout component; Lighthouse a11y 100, best-practices ≥ 95.

---

## Phase 3 — Study features (what makes it more than notes)
*Effort: ~1 week · Risk: low additive*

- **Search** — build-time `search-index.json` (title, section, snippet) + client filter; `/` to focus.
- **Chapter TOC + progress rail** — sticky, scroll-spy, “12 of 34 sections read”.
- **Progress & bookmarks** — `localStorage`: visited sections, quiz best score, flagged tricky questions.
- **Exam mode** — 17 MCQs drawn by paper weighting (2 from Ch 1/6/10, etc.), timed, review after submit.
- **Flashcards / spaced repetition** — definitions and equations already structured; SM-2 lite.
- **Printable workbook** — questions without answers, answers in appendix.
- **Offline PWA** — service worker caching chapters + fonts; huge for low-connectivity students.
- **Import/export progress** as JSON.

---

## Phase 4 — Content completeness & trust
*Effort: ongoing*

- Produce the **89 diagrams** (see `docs/DIAGRAMS.md`), starting with the 7 existing ch02 assets.
- Reconcile exam mapping against the official paper scheme once, then single-source it.
- Fact-check pass on flagged “book errors” (20 `error` blocks) — these are assertions about the textbook and should be verified or softened.
- Per-chapter review checklist: every exam-mapped topic has a long answer, every section has ≥1 MCQ, every figure has a caption.

---

## Sequencing & dependencies

```
Phase 0 (bugs/truth)
   └──► Phase 1 (split + schema + CI + router)
            ├──► Phase 2 (design system)  ◄── needs design.md
            │        └──► Phase 3 (features)
            └──► Phase 4 (diagrams)  ◄── can run in parallel from day 1
```

Diagram production (Phase 4) is independent and is the single largest content gap — start it immediately after 0.2.

---

## Metrics to hold the line

| Metric | Now | Target |
|---|---|---|
| Dead references | 82 | 0 (CI-enforced) |
| Silently dropped content | 12 SQs | 0 (schema-enforced) |
| Tests executed | 0 | ≥ 30 |
| CI gates before deploy | 0 | tests + schema + html-validate |
| Unique hex colours | 46 | ≤ 18 |
| Declarations < 12px | 43 | 0 |
| Emoji generated per site | 816 | 0 |
| `!important` in print | 89 | ≤ 10 |
| axe serious/critical | unknown (no aria) | 0 |
| Lighthouse (mobile) | unmeasured | Perf ≥ 95, A11y 100, SEO ≥ 95 |
| Chapter page weight | 48 KB HTML + 44–88 KB JSON | ≤ 60 KB HTML + JSON, figures lazy |

---

## Risk register

| Risk | Mitigation |
|---|---|
| Redesign breaks print (the one feature students rely on) | Print golden snapshots before Phase 2; print check is part of DoD |
| Split into modules breaks GitHub Pages subpath | All imports relative; test on a project subpath, not just root |
| Schema too strict stalls content authoring | Schema warns first (`validate`), errors only in `--strict`/CI |
| Design drift returns | Tokens are the only place colour/size may appear; lint rule (`stylelint` custom) in Phase 2 |
| Diagram production is slow (89 figures) | Template + spec + per-chapter batches; ship ch02 (7) immediately as proof |
| Content edits by non-devs | Validator gives plain-language errors with file + field path |

---

## Definition of done (per change)

1. `npm test` green, `npm run validate` clean.
2. No new raw hex outside `tokens.css`; no new `!important`; no emoji.
3. Keyboard-only pass on the touched view.
4. Print preview checked (chapter view).
5. Mobile 360px + desktop 1440px checked.
