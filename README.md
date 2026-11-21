# FSc Chemistry XI — Study Notes

**BISE Bahawalpur · Smart syllabus · Chapters 1–14**

A static, single-page study guide built to be read on a phone on the way to school and printed the night before the paper. Warm paper, burgundy ink, butter highlights, and a colour switcher if burgundy is not your thing.

No framework, no build step, no backend: `index.html` plus three asset folders, deployed straight to GitHub Pages.

---

## What is inside

| | |
|---|---|
| Chapters | 14 retained, 2 marked deleted from the syllabus |
| Notes | ~108,000 words across 19 content block types |
| Questions | 175 MCQs · 147 short questions · 27 long questions |
| Practice | 280 quiz items with explanations |
| Diagrams | 82 referenced, 7 drawn (see `docs/DIAGRAMS.md`) |
| Tests | 27 (Jest + jsdom, executing the real app bundle) |

---

## Repository map

```
index.html                 shell: sidebar, top bar, page container
404.html                   GitHub Pages fallback
favicon.svg
DESIGN.md                  design tokens + rationale (lints with @google/design.md)
assets/
  css/app.css              the whole design system (paper theme, accents, night mode, print)
  js/theme.js              applies the stored accent/mode before first paint
  js/app.js                router, renderer, quiz, sanitizer, interactions
  diagrams/chXX/*.svg      figures
chapters/
  manifest.json            chapter list + exam weightage
  ch01.json … ch14.json    content
scripts/validate-content.mjs
__tests__/                 Jest suite + jsdom helper
docs/                      audit, roadmap, diagram plan, security log, upgrades
```

---

## Run locally

The app fetches JSON, so it needs a server (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Checks:

```bash
npm ci
npm test                # 27 tests
npm run validate        # content report
npm run validate:strict # non-zero exit for CI
```

`npm run test:coverage` exists, but the app is still one classic script; meaningful coverage arrives with the ES-module split in `docs/UPGRADES.md` (U-08).

---

## Adding or editing a chapter

1. Create `chapters/chXX.json` using the shape below.
2. Add or flip the entry in `chapters/manifest.json` (`"status": "ready"`).
3. `npm run validate` — it checks block types, answer indices, diagram paths and duplicate section numbers.

```json
{
  "meta": { "id": "ch03", "number": 3, "title": "Chemical Bonding",
            "exam_info": "1 MCQ · Q3 Short Questions · Q6(a) Long Question",
            "deleted": "optional — portions removed from the syllabus",
            "notes_merged": "optional provenance note" },
  "sections": [{ "id": "sec31", "number": "3.1", "title": "…", "blocks": [] }],
  "mcqs": [{ "num": "Q1", "q": "…", "opts": ["A","B","C","D"], "ans": 1, "exp": "…" }],
  "sqs":  [{ "num": "SAQ a", "q": "…", "a": "<p>…</p>", "tag": "Board-style answer" }],
  "lqs":  [{ "title": "Q6(a)", "marks": "4 marks", "q": "…",
             "parts": [{ "label": "Part 1", "points": ["…"] }] }],
  "quiz": [{ "q": "…", "opts": ["A","B","C","D"], "ans": 2, "exp": "…" }]
}
```

### Block types

| `type` | Required | Notes |
|---|---|---|
| `p` | `t` | Paragraph (HTML allowed) |
| `subsec` | `t` | Uppercase subsection label |
| `def` | `text` | Definition card (`label`, `src` optional) — butter |
| `concept` | `head` | Concept builder (`body`, `items`, `eq`, `note`) |
| `info` | `head` | Note card (`body`, `items`) |
| `tip` | `t` | Exam tip |
| `error` | `wrong`, `correct`, `reason` | Flagged textbook error (`head` optional) |
| `eq` | `t` | Monospace equation block |
| `table` | `cols`, `rows` | Scrollable table with burgundy header |
| `ul`, `ol` | `items` | Lists |
| `factors` | `items[{num,title,body}]` | Numbered factor cards |
| `trends` | `cards[{prop,across,down,body}]` | Two-column trend grid |
| `reactions` | `head`, `rxns[{eq,note}]` | Reaction box |
| `orbitals` | `items[{sym,shape,body}]` | Orbital grid |
| `qn-grid` | `items[{name,sym,body,vals}]` | Quantum-number cards |
| `qc` | `items[{q,ans}]` | Quick-check accordion |
| `diagram` | `file`, `alt` | Figure (`caption`, `number`, `source`, `width`, `height` optional) |
| `note`, `deleted` | `t` | Inline provenance / deletion notice |

Content is HTML but not trusted blindly: every string is passed through an allowlist sanitizer at load (15 tags, `class` only), so scripts, handlers, styles and ids are stripped before rendering.

---

## Diagrams

Paths follow one rule: `assets/diagrams/chXX/chXX_<slug>.svg`, lowercase, one file per figure. The validator fails on unknown paths, missing `alt`, or a figure filed under the wrong chapter. See `docs/DIAGRAMS.md` for the contract, template and backlog.

---

## Theming

`DESIGN.md` is the source of truth: warm paper, burgundy ink, butter highlight, dashed rules, uppercase micro-labels. The app ships four accent inks — Burgundy, Forest, Indigo, Plum — and two modes, Paper and Night. The choice lives in `localStorage` (`chem.accent`, `chem.mode`) and is applied before paint by `assets/js/theme.js`.

```bash
npx @google/design.md lint DESIGN.md   # 0 errors, 0 warnings
```

All tokens live in `assets/css/app.css` under `:root`, `[data-accent=…]` and `[data-mode=dark]`.

---

## Deployment

Pushes to `main` run the test + content jobs first; only then does the deploy job stage `dist/` (index, 404, favicon, `assets/`, `chapters/`) and publish it. Tests and repository files are never published.

- Actions are pinned to commit SHAs and kept current by Dependabot.
- Strict Content-Security-Policy: `script-src 'self'`; no inline script, no inline handlers, no inline styles.
- No third-party requests: system fonts only.

See `docs/SECURITY.md` for the threat model and the open items.

---

## Documentation

| File | Contents |
|---|---|
| `DESIGN.md` | design tokens and component rules |
| `docs/AUDIT.md` | defect register with evidence |
| `docs/ROADMAP.md` | phased improvement plan |
| `docs/DIAGRAMS.md` | figure system + production backlog |
| `docs/SECURITY.md` | security findings and remediation log |
| `docs/UPGRADES.md` | feature menu ranked by return on effort |

Built for Hex — KEMU MBBS pathway · boards in two months.
