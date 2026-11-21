# Repository Audit — `x7en/chemistry-notes`

> **Fix status (2026-11-19, this branch).** Fixed: BUG-01 (82 paths normalised to
> `assets/diagrams/chXX/`), BUG-02 (ch12 `sqs`), BUG-03 (test harness runs the real
> bundle — 27/27 tests pass), BUG-04 (semantic `<figure>`, escaped attributes,
> delegated error fallback), BUG-05 (sticky topbar), BUG-06 (quiz reset),
> BUG-07/08 (derived sidebar data), BUG-11 (empty ids), BUG-12 (abort + stale
> guard), BUG-13 (missing `meta.number`), BUG-14 (`res.ok`), BUG-15 (keyboard +
> aria on collapsibles), BUG-16 (print pagination), BUG-17 (`prefers-reduced-motion`),
> BUG-18 (deleted nav no longer “active”), BUG-19 (deleted chapters message).
> Also fixed this pass: SEC-01..SEC-10 (see `docs/SECURITY.md`) — allowlist
> sanitizer, delegated listeners, strict CSP + referrer policy, audit fix
> (18 moderate / 0 high dev-only), system font stacks, SHA-pinned Actions,
> `dist/`-only deploy, content-ID stripping, `data-quiz-answer` + `validAnswer()`.
> **Redesign shipped** (this branch, uncommitted): `DESIGN.md` (tokens + rationale,
> lints clean), `assets/css/app.css` (notebook theme: cream paper, dot grid,
> burgundy ink, butter highlights, dashed rules, micro-labels), `assets/js/theme.js`
> (pre-paint accent/mode restore), user-facing colour switcher (Burgundy default,
> Forest / Indigo / Plum, Paper / Night), CSP-safe `404.html`, `favicon.svg`,
> `README.md`, `legacy.css` (pre-redesign stylesheet) marked for deletion.
> Open: the **82 figures** (not yet drawn), **BUG-09/10** (exam-mapping conflicts —
> needs a syllabus ruling, not a guess), and P2/P3 process debt.
> `scripts/validate-content.mjs`: 82 errors / 14 warnings — only not-yet-drawn
> figures remain.

**Audited:** 2026-11-19 · branch `arena/7a36a0b3-chemistry-notes` · base `1bb962d`
**Scope:** full source, all 14 chapter datasets, tests, CI, assets.
**Method:** static read-through, scripted content validation, jsdom render probes, contrast computation.

---

## 1. Executive summary

The repo is a **single-page, zero-build study site** for FSc Chemistry XI (BISE Bahawalpur): one 1,096-line `index.html` containing 604 lines of CSS and 445 lines of JS, plus 14 JSON chapter files (~108k words of content). The content model is genuinely good — a stable block vocabulary, clean data, real print styles. The *engineering* around it is where it breaks.

Eight things matter most, in order:

1. **All 82 diagram references are dead.** Every `diagram` block points at `diagrams/chXX_name.svg`; no such path exists. The 7 SVGs that *do* exist (`Diagrams/ch02/*.svg`) are never referenced by any content. Nothing renders except the fallback placeholder.
2. **Chapter 12's short questions never render.** `ch12.json` uses the key `saqs`; the renderer reads `sqs`. 12 questions are silently dropped.
3. **The entire test suite is dead.** `__tests__/helpers/appDom.js:9` reads `app-inline.js`, which is not in the repo. `npm test` fails before a single test runs. CI never runs tests anyway.
4. **The diagram fallback is itself broken HTML.** It builds `innerHTML` inside an inline `onerror` string; a caption containing `<` or `"` (ch08 has `[A]<[B]`) corrupts the DOM and leaks markup into the page.
5. **There is no design system.** 46 unique hex colours, 8 competing accent colours, 9 border-radius values, 43 font-size declarations below 12px, ~1,600 emoji glyph instances, and 89 `!important`s in the print block.
6. **Accessibility is essentially absent.** Zero `aria-*` attributes, zero focus styles, every section heading is a `<div>` (no document outline), and collapsibles are `<div onclick>` — invisible to keyboard and screen readers.
7. **`design.md` does not exist** anywhere in the repo or its git history (single commit). It is a blocker for the UI work, not a detail.
8. **The UI has structural CSS bugs**, not just taste problems — a sticky topbar that cannot stick, a quiz reset that leaves a stale score, hardcoded deleted-chapter labels and counts that are already wrong.

Good news: the content itself is clean. All 175 MCQs have exactly 4 options and in-range answers, no duplicate questions, no unknown block types, no mismatched quiz answers. The problems are concentrated in plumbing, assets, and presentation.

---

## 2. What the repo actually is

| Fact | Value |
|---|---|
| Stack | Static HTML + inline CSS + inline JS, no framework, no build |
| Hosting | GitHub Pages via `actions/deploy-pages` |
| Routing | `location.hash` (`#ch01` … `#ch16`) |
| Content | 14 ready chapters, `manifest.json` + `chXX.json` |
| Content volume | 845,726 chars · ~108,000 words |
| Question bank | 175 MCQs · 147 short questions · 27 long questions · 280 quiz items |
| Diagrams referenced | 82 · **resolvable: 0** |
| Diagram files present | 7 (`Diagrams/ch02/`) · **referenced: 0** |
| Tests | 1 suite, `app-inline.js` missing → **0 tests execute** |
| Commit history | 1 commit (“Add files via upload”) |

### File inventory

```
index.html                48,628 B   1,096 lines   (604 CSS + 445 JS + 47 markup)
chapters/manifest.json     4 KB      16 entries (14 ready, 2 deleted)
chapters/ch01..ch14.json   44–88 KB  ~846 KB total
chapters/temp              empty stray file
Diagrams/ch02/*.svg        7 files, 2.4–9.8 KB each, orphaned
Diagrams/chXX/.gitkeep     16 empty placeholders
__tests__/app.test.js      ~300 lines, never executes
__tests__/helpers/appDom.js  49 lines, requires missing app-inline.js
.github/workflows/static.yml  deploy only — no test/lint gate
README.md                  152 lines, documents a 3-chapter repo that no longer exists
package.json               test script only; "main": "index.js" (does not exist)
```

### Runtime flow

```
init()
  └─ fetch chapters/manifest.json ──► renderSidebar()
  └─ router()
        ├─ no hash / "home" ──► renderHome()          (hardcoded stats)
        └─ #chXX ─────────────► loadChapter(meta)
                                  ├─ fetch chapters/chXX.json  (no cache, no abort)
                                  └─ renderChapter(data)
                                        ├─ renderSection → renderBlock[19 types]
                                        ├─ renderMCQ / renderSQ / renderLQ
                                        └─ initQuiz (if data.quiz)
```

---

## 3. Defect register

Severity: **P0** = breaks the product · **P1** = user-visible bug · **P2** = design/systemic debt · **P3** = process/content hygiene.

### P0 — Blocks the product

#### BUG-01 · All 82 diagrams are 404s
- **Evidence:** `scripts/validate-content.mjs` → `82 missing`. e.g. `chapters/ch03.json:84` → `"file": "diagrams/ch03_ss_overlap.svg"`. No `diagrams/` directory exists; assets live in `Diagrams/ch02/` (capital D, per-chapter subfolders, same flat naming otherwise).
- **Impact:** Chapters 3–14 render a placeholder box in 82 places, including every MO diagram, Born–Haber cycle, cell diagram and mechanism. On a case-sensitive host (GitHub Pages) the capitalisation alone guarantees failure even if the folder existed.
- **Root cause:** no single source of truth for asset paths and no validation.

#### BUG-02 · Chapter 12 short questions are silently dropped
- **Evidence:** `chapters/ch12.json:957` uses key `saqs` (12 items); `index.html:815` reads `data.sqs`. All other chapters use `sqs`.
- **Impact:** an entire question category disappears, with no error. The chapter still shows MCQs, so it looks “fine”.

#### BUG-03 · Test suite cannot run
- **Evidence:** `__tests__/helpers/appDom.js:9` — `fs.readFileSync('../../app-inline.js')` → `ENOENT`. Verified: `1 failed, Tests: 0 total`.
- **Impact:** no regression safety net; `npm test` / `jest --coverage` fails immediately. CI (`.github/workflows/static.yml`) only uploads and deploys, so a broken build still ships.

#### BUG-04 · Diagram fallback generates invalid HTML
- **Evidence:** `index.html:976–983`. The `onerror` handler is an inline string that reassigns `parentElement.innerHTML`, with the caption interpolated after only `.replace(/"/g,"'")`.
- **Proof (jsdom):** caption `Pi bond: "side-on" overlap < 2p` produces
  `... Pi bond: 'side-on' overlap < 2p <br><span ...>` inside an attribute — the `<` opens a bogus tag and the caption escapes the wrapper, duplicating/overwriting surrounding content.
- **Real trigger:** `chapters/ch08.json` caption contains `[A]<[B]`.
- **Impact:** malformed DOM, visually broken figure, and content leakage outside the figure.

### P1 — User-visible bugs

| ID | Defect | Evidence | Impact |
|---|---|---|---|
| BUG-05 | Sticky topbar cannot stick | `.main-area { overflow:hidden }` (`index.html:95`) wraps `.topbar { position:sticky }` (`:96–101`) | On mobile the topbar scrolls away; the menu button is lost on long chapters |
| BUG-06 | Quiz “Try Again” keeps the final score | `initQuiz()` (`:1047`) resets `_qz` but never resets `#qscore`; only `answerQuiz` writes it | Restart shows “Score: 14 / 20” on a fresh quiz |
| BUG-07 | Sidebar hardcodes deleted range | `index.html:694` — `Deleted (Ch 15–16)` | Breaks the moment chapters are added/removed; should derive from manifest |
| BUG-08 | Sidebar/footer counts are wrong | `index.html:628` — “14 chapters · 17 MCQs · 3 Long Qs”; actual bank: 175 MCQs / 27 LQs; home says “5 Long Questions” (`:740`); README says 5 | Three different numbers for the same fact |
| BUG-09 | Exam mapping drifts between manifest and chapter meta | All 14 ready chapters differ (`chapters/manifest.json` vs `meta.exam_info`) | Two sources of truth, already contradictory |
| BUG-10 | Genuine exam-mapping conflicts | ch06 meta adds `Q8(a) Long Question` absent from manifest; ch12 manifest says `Q4 · Q9(a)` but meta says `Q3 · Q8(b)`; ch14 meta says `Q3 & Q4`; ch02 manifest claims 1 MCQ, meta omits it | Students revise the wrong questions |
| BUG-11 | Empty `id` attributes | `renderSection` (`:842`) emits `<div class="section" id="">` for sections without `id` | Invalid/senseless DOM, blocks future anchor links |
| BUG-12 | No request cancellation or caching | `loadChapter` (`:761`) has no `AbortController`, no memoisation, no stale-response guard | Fast nav can paint chapter A under hash B; every revisit refetches |
| BUG-13 | `renderChapter` crashes on missing `meta.number` | `m.number.toString()` (`:793`) unguarded | One malformed chapter file blanks the app |
| BUG-14 | `init()` ignores HTTP status | `fetch('chapters/manifest.json')` then `res.json()` (`:658`) | A 404 HTML page yields “Could not load manifest.json”, hiding the real cause |
| BUG-15 | No keyboard access to collapsibles | `.sq-q` / `.qc-q` are `<div onclick>` (`:1006`, `:966`); no `tabindex`, `role`, or key handler | Keyboard/AT users cannot open any short question or quick check |
| BUG-16 | Print clips long sections | `@media print .section { page-break-inside:avoid }` (`:490`, repeated `:601`) | Any section taller than a page cannot paginate; content is cut |
| BUG-17 | Scroll-to-top ignores reduced motion | `html { scroll-behavior:smooth }` (`:31`), no `prefers-reduced-motion` guard | Accessibility issue for motion-sensitive users |

| BUG-18 | Deleted chapters highlight on Home | `updateActiveNav('')` compared `href === '#'`, which matches every deleted entry's `href="#"` | Gold “active” styling on struck-through chapters |
| BUG-19 | Deep link to a deleted chapter shows “not yet available” | `router` → `loadChapter` fetched `chapters/ch15.json` | Misleading error for a chapter that is deliberately out of syllabus |

### P2 — Design / systemic debt (the “slop”)

| Area | Measured | Why it reads as slop |
|---|---|---|
| Colour | **46 unique hex values**, 8 accents (gold, teal, red, green, blue, purple, amber, + neutrals) | Every block type invents its own hue. Nothing is more important than anything else, so nothing is readable as hierarchy |
| Type | 3 families (Crimson Pro, Fraunces, JetBrains Mono) across 4 roles; **43 declarations < 12px** (9px ×9, 10px ×24, 11px ×10) | Micro-labels the size of fine print; serif body + serif display + mono everywhere |
| Radii | 9 values (3/4/5/6/7/8/10/20px/50%) | Adjacent cards visibly mismatch corners |
| Spacing | Ad-hoc margins 3,4,5,6,7,8,9,10,12,14,18,22,32,44 | No rhythm; dense/unbalanced vertical flow |
| Nesting | `def-box`/`concept`/`info`/`tip`/`error`/`note` all are bordered cards *inside* already-bordered sections | Card-in-card-in-card; 6 near-identical components with different colours |
| Chrome | 6 icon-label patterns for the same idea (“Definition”, “Concept Build”, “Info”, “Exam Tip”, “Book Error”, “From Notes”) | Author-facing taxonomy leaking into the UI |
| Emoji | 816 emoji generated across the site (~58 per chapter: one on every concept box, info box, tip, error box, quick-check and chapter header), 22 literals in `index.html`: 🎯 🗑 ✎ 📖 🧠 📌 ⚡ ⚠️ ❌ ✅ 📐 📝 | Emoji as iconography at 9–10px, inconsistent across platforms |
| Mode | Dark-only; diagrams have a **hardcoded `#0c0f14` background** | Printing produces black rectangles; no light mode |
| Interaction | MCQ correct answer rendered with `.correct` before the user answers | No self-testing; the “quiz” is the only interactive learning tool |
| Fix-ups | 89 `!important` in the print block; 14 inline `style=` in templates | Print CSS fights the screen CSS instead of reusing tokens |

Concrete example of the visual noise budget on one chapter page: 6 card styles × 8 accent colours × 3 typefaces × 43 tiny label sizes, all at once, for content whose actual structure is “heading → paragraph → list → figure → answer”.

### P3 — Process & content hygiene

| Item | Detail |
|---|---|
| `design.md` missing | Referenced as the design source of truth; absent from the repo and from git history |
| Stale README | Still describes a 3-chapter repo, “never edit this” index, and omits block types that exist (`qc`, `diagram`, quiz) |
| No content schema | `saqs` vs `sqs` (BUG-02) and the 82 bad paths (BUG-01) are exactly what a schema catches |
| CI deploys everything | `.github/workflows/static.yml` uploads `.` including tests, jest config, package-lock; no test or validation step |
| `chapters/temp` | Empty stray file committed by accident |
| No metadata | No `meta description`, no Open Graph/Twitter card, no favicon, no `theme-color`, no `color-scheme` |
| No 404 page | GitHub Pages serves its own 404 for unknown paths |
| External font dependency | Google Fonts is render-blocking and unavailable offline/behind blocks — common in target schools |
| No LICENSE | `license: ISC` in package.json but no LICENSE file |
| `package.json` cruft | `"main": "index.js"` (absent), markdown bold in `description` |
| No search, TOC, progress, bookmarks | 108k words with only a 14-item sidebar |

---

## 4. Accessibility findings

- **0** `aria-*` attributes; **0** focus-visible styles; **0** skip link.
- **Heading structure:** only `<h1>` (home hero) and `<h2>` (chapter title). Section titles, subsections, MCQ/SQ/LQ headings are `<div>`/`<h3>` mixed — screen-reader users get no outline for a 108k-word document.
- **Contrast:** body text is excellent (`#dce4ef` on `#0c0f14` = 14.98:1). The failures are in the micro-labels actually used for meaning:
  - `--purple #9070d0` on `--bg3` = **4.19:1** (used at 10–11px for quantum-number labels)
  - `--red #d95f5f` on `--bg3` = **4.45:1**
  - `--text2 #7a8899` on `--bg3` = **4.49:1** (used at 9–10px)
  WCAG AA normal text needs 4.5:1; at 9px the practical requirement is higher.
- **Touch targets:** `.ch-item` 9px padding ≈ 34px tall; `.menu-btn` ≈ 31px — under the 44px guidance.
- **State is colour-only** for correct/incorrect quiz options.
- **Collapsibles** lack `aria-expanded` and are not focusable (BUG-15).
- Language is correctly declared (`lang="en"`).

---

## 5. Performance & robustness

- **Page weight:** per chapter ≈ 44–88 KB JSON + 48 KB HTML + fonts. Acceptable. GitHub Pages gzips.
- **Fonts:** 3 families × 6 weights, render-blocking, no `preconnect`, no local fallback metrics → FOUT and layout shift; a blocked `fonts.googleapis.com` (common on school networks) yields Georgia fallback and different metrics.
- **Render strategy:** full `innerHTML` rebuild per navigation; no caching of parsed chapters, so back/forward refetches.
- **Images:** diagrams would be `<img loading="lazy">` (good) but no `width`/`height`, so once they exist they will cause CLS.
- **No error boundary:** a single malformed block type returns `''` silently; a malformed meta throws and blanks the page.
- **Offline:** unusable (no service worker, fonts remote, data fetched on demand).

---

## 6. Security & content trust

- Everything is injected with `innerHTML` from JSON (`p.t`, `sq.a`, options, captions). The content pipeline is AI-generated + hand-uploaded, so this is “trusted-ish”, but:
  - **Inline event handlers** (`onclick`, `onerror`) make a strict CSP impossible; any injected script would execute.
  - **Attribute-context injection:** `b.file`, `b.alt`, captions are interpolated into attribute values without escaping (BUG-04 is one instance).
  - A single stray `<` or `"` in authored HTML silently mangles layout (83 `<`-in-text occurrences across the corpus; all currently benign because HTML5 tolerates `<` before space/digit, but not in attributes).
- **Recommendation:** keep HTML in content (it is the point), but escape into attributes, replace inline handlers with delegated listeners, and add a CSP (`script-src 'self'`).

---

## 7. What is genuinely good

Worth protecting during the redesign:

- **Zero build, zero dependency runtime.** Deploy = push. That is a real feature for a teacher-maintained site.
- **Clean content/UI separation** with a stable block vocabulary — 19 block types covering the whole corpus with zero unknown types.
- **Data quality:** 175/175 MCQs valid (4 options, in-range answers, explanations present), no duplicate questions, quiz items are not clones of the MCQs, section numbering has no duplicates.
- **Print support exists** and is thought through (answers forced open, colours converted, A4 page margins) — rare and valuable for a board-prep site.
- **Honest pedagogical taxonomy** (book-error flags, exam tip, deleted-portion notices) — the *information* is good even if the *chrome* is noisy.

---

## 8. `design.md` — status and dependency

**`DESIGN.md` exists at repo root** and lints clean with `npx @google/design.md lint DESIGN.md` (0 errors, 0 warnings: 18 colors, 7 typography scales, 4 rounding levels, 7 spacing tokens, 19 components). It carries YAML token frontmatter plus Overview / Colors / Typography / Layout / Elevation & Depth / Shapes / Components / Do's and Don'ts. `assets/css/app.css` implements the tokens (`--paper`, `--ink`, `--accent`, `--butter`, `--radius`, spacing scale) and the four accent inks + Paper/Night modes.

The audit below is the **pre-redesign record** of what the slop was; the design system in `app.css` answers every P2 row (one accent family, one type scale, 4 radii, token spacing, card-in-card removed, emoji removed from chrome, hardcoded diagram backgrounds gone, light + night mode).

---

## Appendix A — Reproduce the findings

```bash
npm ci
npm test                                   # fails: app-inline.js missing (BUG-03)
node scripts/validate-content.mjs          # 166 errors, 14 warnings (BUG-01, BUG-02, BUG-09)
node scripts/validate-content.mjs --strict # non-zero exit (CI gate, once P0s fixed)

# dead diagram references
node -e 'const fs=require("fs");for(const f of fs.readdirSync("chapters").filter(x=>x.startsWith("ch"))){const d=JSON.parse(fs.readFileSync("chapters/"+f));JSON.stringify(d).match(/"file":"[^"]+"/g)?.forEach(m=>{const p=m.slice(8,-1);if(!fs.existsSync(p))console.log(f,p)})}'

# malformed diagram fallback
node -e 'const {JSDOM}=require("jsdom");/* see BUG-04 in this doc */'
```

## Appendix B — Numbers used in this audit

| Metric | Value |
|---|---|
| `index.html` | 48,628 B / 1,096 lines (604 CSS, 445 JS) |
| Chapter data | 845,726 chars, ~108k words |
| MCQs / SQs / LQs / quiz | 175 / 147 / 27 / 280 |
| Diagram refs / files | 82 / 7 (0 overlap) |
| Unique hex colours | 46 |
| Accent colours | 8 |
| Border-radius values | 9 |
| Font-size declarations < 12px | 43 |
| `!important` in print CSS | 89 |
| Inline `style=` in templates | 14 |
| `aria-*` occurrences | 0 |
| Emoji generated per full site | 816 |
