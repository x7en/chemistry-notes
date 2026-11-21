# Diagram System — Plan for Introducing Figures into Chapter Notes

Companion to `docs/AUDIT.md` (BUG-01, BUG-04) and `docs/ROADMAP.md` (Phase 4).

---

## 1. Where we are

> **Update:** the path convention in §2.1 is now implemented — all 82 references
> were rewritten to `assets/diagrams/chXX/…` and the 7 finished ch02 assets were
> moved to `assets/diagrams/ch02/`. None of the 82 referenced figures exist yet.
> The section below is the audit-time picture that motivated the change.

- The content already asks for **82 diagrams** across chapters 3–14 — `diagram` blocks with `file`, `alt`, `caption` are authored and placed in the right sections.
- **None of the 82 files exist.** Every reference is `diagrams/chXX_<slug>.svg` (lowercase, flat directory).
- **7 real SVGs exist** in `Diagrams/ch02/` — and no chapter references them. Chapter 2 has zero `diagram` blocks. The only finished artwork in the repo is invisible.
- The fallback placeholder is broken HTML (BUG-04) and prints the raw path at the student.

So the job is **not** “add diagrams to the notes”. It is:
1. make the 82 existing placements resolve,
2. design a figure component worth the content,
3. produce 89 assets under one convention,
4. make them survive dark mode, print, mobile, and screen readers.

### Current inventory

| Chapter | Refs | Status | Notable topics |
|---|---|---|---|
| ch01 | 0 | — | (periodic trends — candidates below) |
| ch02 | 0 | **7 orphaned assets** | d-orbitals, electric-field deflection, IE succession, spin, energy order, Hund boxes, orbital summary |
| ch03 | 20 | all missing | σ/π overlap, hybridisation sp/sp²/sp³, shapes, MO diagrams (H₂, He₂, N₂, O₂) |
| ch04 | 2 | all missing | mole triangle, stoichiometry flowchart |
| ch05 | 7 | all missing | ID–ID, dipole–dipole, H-bond, ice, bp graph, surface tension, vapour equilibrium |
| ch06 | 10 | all missing | enthalpy profiles, Hess cycles, calorimeter, Born–Haber, lattice energies |
| ch07 | 4 | all missing | concentration–time, Boltzmann ×2, catalysed profile |
| ch08 | 3 | all missing | equilibrium cases, temperature effect, catalyst |
| ch09 | 3 | all missing | Kw vs T, pH scale, buffer mechanism |
| ch10 | 6 | all missing | electrolytic cell, double layer, SHE, half-cells, galvanic cell |
| ch11 | 12 | all missing | cycloalkanes, sp³/sp², ethene, mechanisms, ozonolysis, diene delocalisation |
| ch12 | 10 | all missing | N₂ Lewis, NH₃ lab setup, geometries, PAN, converter, S₈ ring, contact process |
| ch13 | 2 | all missing | halogen colours, water purification |
| ch14 | 3 | all missing | atmosphere layers, photochemical smog, greenhouse effect |
| **Total** | **82** | **0 resolvable** | + 7 orphaned in ch02 → **89 target figures** |

---

## 2. Target contract

### 2.1 Path convention (one rule, enforced)

```
assets/diagrams/<chapterId>/<chapterId>_<kebab-slug>.svg
```

Examples:
```
assets/diagrams/ch02/ch02_hunds_rule_boxes.svg
assets/diagrams/ch03/ch03_sigma_vs_pi.svg
assets/diagrams/ch10/ch10_zn_cu_galvanic_cell.svg
```

Rationale: lowercase everywhere (URLs are case-sensitive on GitHub Pages); one folder per chapter (89 files stay browsable); filename keeps chapter context when opened standalone; matches the naming of the 7 existing assets, so they need only a folder move.

The 82 refs get rewritten mechanically (`diagrams/ch03_x.svg` → `assets/diagrams/ch03/ch03_x.svg`), and the validator enforces the pattern for any future block.

### 2.2 Block schema

```json
{
  "type": "diagram",
  "file": "assets/diagrams/ch03/ch03_sigma_vs_pi.svg",
  "alt": "Sigma bond from head-on overlap versus pi bond from side-on p-orbital overlap",
  "caption": "σ vs π bonding — axial vs lateral overlap",
  "number": "3.4",
  "source": "Book p. 61",
  "width": 640,
  "height": 380
}
```

| Field | Required | Notes |
|---|---|---|
| `file` | yes | Must match the path pattern and exist |
| `alt` | **yes** | Describes the chemistry, not “diagram”. Validator rejects empty/`diagram` |
| `caption` | recommended | One line; may use inline HTML (`<em>`, `<sub>`) |
| `number` | no | Auto-numbered per chapter (`Fig. 3.4`) when absent |
| `source` | no | Book page reference, rendered small |
| `width`/`height` | no | Defaults 640×400; used to reserve space (no CLS) |

### 2.3 Renderer output

```html
<figure class="figure" id="fig-3-4">
  <button class="figure-zoom" type="button" aria-label="Enlarge figure 3.4">
    <img src="assets/diagrams/ch03/ch03_sigma_vs_pi.svg"
         alt="Sigma bond from head-on overlap versus pi bond from side-on p-orbital overlap"
         width="640" height="380" loading="lazy" decoding="async">
  </button>
  <figcaption>
    <span class="figure-num">Fig. 3.4</span>
    σ vs π bonding — axial vs lateral overlap
    <span class="figure-src">Book p. 61</span>
  </figcaption>
  <div class="figure-missing" hidden>
    Figure 3.4 is being prepared — <span class="figure-path">ch03_sigma_vs_pi.svg</span>
  </div>
</figure>
```

Key changes from today:

| Today | Target |
|---|---|
| `<div style="text-align:center">` | semantic `<figure>` + `<figcaption>` |
| inline `style` attributes | CSS class |
| fallback built by `onerror` + `innerHTML` string | hidden sibling toggled by a delegated, capturing error listener |
| no dimensions | `width`/`height` reserved → no layout shift |
| no `<title>`/`<desc>` in SVG | required in authored files |
| raw path shown on failure | human message + path only in dev/`<details>` |
| no zoom | optional lightbox `<dialog>` (Phase 3) |

**Fallback implementation** (fixes BUG-04):

```js
// error events do not bubble — capture them at the page container
page.addEventListener('error', (e) => {
  const img = e.target;
  if (img instanceof HTMLImageElement) {
    img.closest('.figure')?.classList.add('is-missing');
  }
}, true);
```

Caption/alt are inserted with `textContent` (or escaped), never concatenated into an attribute string.

### 2.4 CSS behaviour

```css
.figure { margin: 24px 0; }
.figure img {
  display: block; width: 100%; height: auto;
  background: var(--figure-plate);       /* paper plate, both themes */
  border: 1px solid var(--border);
  border-radius: 8px;
}
.figure figcaption { font-size: 13px; color: var(--text-2); margin-top: 8px; }
.figure-num { color: var(--text-1); font-weight: 600; margin-right: 6px; }
.figure.is-missing img { display: none; }
.figure.is-missing .figure-missing { display: block; }

@media print {
  .figure { break-inside: avoid; margin: 12pt 0; }
  .figure img { max-height: 70vh; border: 1px solid #bbb; }
  .figure figcaption { font-size: 9pt; color: #333; }
}
```

No page-break-inside on the enclosing section (BUG-16) — figures opt into `avoid` individually.

---

## 3. The theming decision (the one that affects every asset)

Diagrams are currently authored with a **baked `#0c0f14` background** (`Diagrams/ch02/*.svg`, first `<rect>` in every file). That is why they would print as black slabs, and why they cannot appear on a light surface. Three options:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Transparent asset + paper plate** *(recommended v1)* | SVG has no background; dark ink on transparent; app always renders it on a light “figure plate” in both themes | One file per figure · print-perfect · theme-proof · zero JS · cache-friendly | Figures are light plates on a dark page (visually deliberate, like textbook plates) |
| B. Two assets (`*.svg` + `*.dark.svg`) | `<picture>` with `prefers-color-scheme`; JS swap on manual theme toggle | True dark artwork | 2× assets (178 files), swap logic, print must force light |
| C. Inline SVG | Fetch and inject `<svg>`; colours from CSS vars | Perfect theming, no extra requests after cache | 10× fetch per chapter, harder caching, markup in DOM, CSP implications |

**Recommendation: A now, C later if dark-native artwork becomes a priority.**
It gives one authoritative asset per figure, correct print output, and keeps the zero-build promise. The paper plate reads as intentional design (textbook figure plates), not as a light-mode leak — and it makes the *diagrams* the only light surface, which is a coherent hierarchy.

If dark-native diagrams are required later, the component already supports B behind a `data-theme` attribute without touching content JSON.

---

## 4. Authoring standard

Every figure must be reproducible by a content author or an authoring agent without design decisions.

### 4.1 Canvas & file

- `viewBox="0 0 640 H"`; `width="640"` and `height="H"` attributes. Typical H 240–420.
- No background rect. No drop shadows. No gradients except electron-density lobes (max 2).
- ≤ 40 KB; ≤ 400 elements. Strip editor metadata.
- `<title>` (figure name) and `<desc>` (one sentence, same idea as `alt`) as first children.
- No external fonts, no `<image>`/raster, no external hrefs.

### 4.2 Palette (works on the light plate, prints on white)

```
ink        #1f2933   primary lines, labels
ink-muted  #5b6673   secondary labels, axes, ticks
grid       #d8d4cb   guide lines, box outlines
accent-1   #b03a2e   energy / high / negative
accent-2   #1f6f8b   structure / positive
accent-3   #2f6f4e   electrons / bonds
accent-4   #a8741a   highlights, deltas
```

Five colours total. Consistent meaning across all 89 figures: **red = energy/heat/negative, blue = structure/lattice, green = electrons/bonds, gold = annotation/value, grey = scaffolding.**

### 4.3 Typography

- `font-family="ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif"` — never a Google font.
- Labels ≥ **12px** at 640 width (≈ 9pt at print scale); titles 13px semibold.
- Sentence case. Chemical symbols italic-free; subscripts via `<tspan baseline-shift="sub" font-size="9">2</tspan>`.
- No emoji, no emoji arrows. Use `<path>` arrowheads via `<marker>` with ids prefixed by the figure slug (ids are global when inlined).

### 4.4 Line & layout

- Stroke 1.75 (structural), 1.25 (guides), `stroke-linecap="round"`.
- 16px minimum internal margin; 24px between logical groups.
- Left-to-right or top-to-bottom reading order only; no overlapping labels.
- Arrows: `marker-end` with a 6×6 triangle; curved arrows get `fill="none"`.

### 4.5 Template

`docs/diagram-template.svg` is the canonical starting point (transparent, tokens documented in a comment, title/desc present). Copy → rename → draw.

---

## 5. Production pipeline

```
spec (caption + alt already in JSON)
  → draw from template (or generate from a data table)
  → scripts/normalize-svg.mjs      strip metadata, enforce viewBox/palette/fonts, add title/desc
  → node scripts/validate-content.mjs   path + alt + existence
  → commit to assets/diagrams/chXX/
```

`scripts/normalize-svg.mjs` (to add in Phase 4) is deliberately boring: no SVG optimiser dependency, just regex/XML checks that fail loudly — wrong canvas, baked background, external font, too large, missing `<title>`, id collisions.

### Production order (highest study value first)

| Batch | Figures | Why first | Effort |
|---|---|---|---|
| **0** | 7 (ch02, exists) | Free win: normalise background/title, add 7 `diagram` blocks in 2.2 / 2.3.2 / 2.4 / 2.5 / 2.6 | ½ day |
| **1** | 20 (ch03) | Densest cluster; σ/π/hybridisation/MO are the most-asked visuals; establishes every pattern the rest reuse | 3–4 days |
| **2** | 16 (ch06 + ch10) | Both are **hot** chapters (2 MCQs each); energy profiles and cells are high-yield | 2–3 days |
| **3** | 22 (ch11 + ch12) | Long-question chapters (Q8(a)/Q9(a)); mechanisms and flowsheets | 3 days |
| **4** | 19 (ch05, ch07, ch08, ch09) | Concept support for short questions | 2–3 days |
| **5** | 12 (ch04, ch13, ch14) | Light, mostly charts and layers | 1–2 days |

≈ 12–15 working days for all 89 at 1–1.5h average; batches 0–2 (43 figures, 45%) cover the highest-value half in under a week.

### Ch02 wiring map (batch 0 detail)

| Section | Existing asset |
|---|---|
| 2.2 Effect of Electric Field on Fundamental Particles | `ch02_electric_field_deflection.svg` |
| 2.3.2 Ionization Energy and Evidence for Electronic Shells | `ch02_successive_IE_be.svg` |
| 2.4 Quantum Numbers | `ch02_spin_quantum_number.svg` |
| 2.5 Shapes of Atomic Orbitals | `ch02_orbital_summary.svg`, `ch02_d_orbitals.svg` |
| 2.6 Electronic Configuration | `ch02_energy_level_order.svg`, `ch02_hunds_rule_boxes.svg` |

These already have content, captions and numbers; they need a background strip, `<title>/<desc>`, folder move, and one JSON block each.

---

## 6. Quality gates

| Gate | Enforced by |
|---|---|
| Every `diagram.file` resolves | `scripts/validate-content.mjs` (already implemented) |
| Path follows the convention | validator (`--strict` in CI) |
| `alt` present and not “diagram” | validator |
| Canvas/palette/fonts/no background | `normalize-svg.mjs` (Phase 4) |
| Missing figures are visible, not silent | renderer fallback + CI coverage report |
| Print: no black slabs, no split figures | print golden test (Phase 1) |
| Mobile: figure ≥ 320px readable, text ≥ 12px in SVG | visual check per batch |

Coverage is reported as `figures present / figures referenced` per chapter, so progress is visible in PR checks instead of being discovered by a student.

---

## 7. Managing 89 figures without it turning into chaos

Drawing the figures is the easy half. Keeping 89 files, 14 chapters and a content pipeline in sync is where these projects usually rot — which is exactly how this repo ended up with 82 dead references and 7 invisible assets. The management model has to make drift *impossible to merge*, not merely noticeable.

### 7.1 One source of truth

**The chapter JSON is the register.** A figure exists because a `diagram` block references it — never the reverse. There is no hand-maintained list of paths to fall out of sync; the inventory is derived:

```
node scripts/validate-content.mjs          # per-chapter coverage, missing files
node scripts/validate-content.mjs --json   # same data, machine-readable for CI
```

A second, editorial-only file (`assets/diagrams/review.json`) records *state* that git cannot express — who checked the chemistry and when:

```json
{
  "assets/diagrams/ch03/ch03_n2_mo_diagram.svg": {
    "state": "published",
    "reviewer": "chemistry",
    "reviewed_at": "2026-11-22",
    "source_page": "Book p. 78"
  }
}
```

Paths appear in exactly two places (content + review), and the validator fails if either side references a file the other does not know about.

### 7.2 Lifecycle

| State | Meaning | Allowed in `main`? |
|---|---|---|
| `planned` | caption/alt authored, file not drawn | yes — renders the honest “being prepared” plate |
| `drafted` | file committed, not chemistry-reviewed | yes, but CI reports it |
| `reviewed` | chemistry checked against the textbook | yes |
| `published` | reviewed + print-checked + alt checked | yes |
| `retired` | replaced; path kept as a redirect or removed from content | yes |

The important rule: **a `planned` entry must be listed in `review.json`.** Today 82 files are simply missing. Once the list exists, CI can be strict — `validate --strict` fails for any missing figure *not* declared planned — which converts “82 silent 404s” into “82 tracked work items” and makes a regression (deleting a published file) a red build.

### 7.3 Ownership and review

- **Content owner** writes `caption` + `alt` (already done for all 82) and chooses the batch.
- **Illustrator** draws from `docs/diagram-template.svg`, commits to `assets/diagrams/chXX/`.
- **Chemistry reviewer** checks a fixed list: atom labels and charges, bond order, arrow direction, ΔH sign, units, state symbols, electron counts, orbital filling order. Board answers are unforgiving on these.
- **Release check** confirms print output and mobile legibility (Phase 4 CI or manual screenshot).

No figure reaches `published` without a named reviewer. That is the only defence against a plausible-looking but wrong diagram — worse than no diagram, because students memorise it.

### 7.4 Naming, storage, caching

- One file per figure, `assets/diagrams/chXX/chXX_<slug>.svg`, lowercase, immutable once published.
- Replacements keep the filename (git history is the version trail); a rename is a content change and must update the JSON in the same commit.
- HTTP caching is free and safe because names are immutable: `Cache-Control: max-age=31536000, immutable` if the host allows (Pages sets ETags; the browser still revalidates cheaply).
- Budget: **≤ 40 KB per figure, ≤ 250 KB per chapter, ≤ 3 MB total.** Diagrams ship as SVG only; photographs (flame colours, precipitates) belong in a separate `assets/photos/` with explicit compression.
- No embedded fonts, no external `href`, no raster fallback inside the SVG.

### 7.5 Automation to add (small, dependency-free)

| Script | Purpose |
|---|---|
| `scripts/diagrams-status.mjs` | human table + coverage % per chapter, from content JSON + fs |
| `scripts/normalize-svg.mjs` | reject baked backgrounds, fixed external fonts, missing `<title>/<desc>`, duplicate ids, >40 KB |
| validator enhancement | `--strict` fails only on *undeclared* missing figures, using `review.json` |
| CI job | posts a coverage table on the PR: `ch03 20/20`, `ch06 3/10`, total `43/89` |
| `docs/figure-preview.html` (optional) | local sheet of all figures at 1× and print scale for batch review |

### 7.6 Reporting

Two numbers, published in every PR and on `main`:

- **Coverage** — published figures / referenced figures (starts at 0/82, 7 unclaimed).
- **Debt** — `planned` entries and their age (a figure planned for 60 days is a decision to drop it, not a plan).

That is the whole management system: one source of truth, a declared backlog that CI enforces, a named reviewer, an immutable naming rule, and a visible percentage. It costs about a day to build and prevents the exact failure this audit found.

## 8. Open decisions

1. **`design.md`** — if it specifies a different palette or a dark-native diagram policy, §3/§4.2 change accordingly; the markup/CSS contract does not.
2. **Figure numbering** — auto per chapter (recommended) vs subject-wide (Fig. 3.4 vs Fig. 24).
3. **Zoom/lightbox** — deferred to Phase 3; on mobile a 640px diagram on a 360px screen is borderline, so a tap-to-zoom dialog is worth scheduling.
4. **Interactive figures** (e.g. orbital filling stepper) — not in scope; the `diagram` block stays static. A separate `interactive` block can be added later without breaking content.
5. **ch01 diagrams** — chapter 1 has none authored. Periodic trends would benefit from 2–3 (atomic radius, IE, electronegativity across/down). Recommend adding to the backlog as batch 2.5.
