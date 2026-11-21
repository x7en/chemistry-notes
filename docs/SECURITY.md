# Security Bug Log

**Project:** `x7en/chemistry-notes` — static study site, GitHub Pages
**Reviewed:** 2026-11-19 · branch `arena/7a36a0b3-chemistry-notes`
**Reviewer:** Arena agent (static analysis, dependency audit, render probes)
**Last updated:** 2026-11-19 — redesign + remediation pass complete

---

## 1. Threat model in one paragraph

There is no backend, no authentication, no cookies, no `localStorage`, no user input, no analytics and no third-party JavaScript. A visitor can only read content. The realistic attack surface is therefore **the content pipeline**: `index.html` renders `chapters/*.json` with `innerHTML`, so anyone who can get a chapter file merged — a contributor, a compromised account, a malicious PR, or an AI-generated file that nobody reviewed — can run arbitrary JavaScript in every student's browser. The second surface is **supply chain**: Google Fonts, GitHub Actions tags, and dev dependencies. Everything below is judged against that model; classic web risks (SQLi, CSRF, session theft) do not apply because there is no session or database.

### Severity key
**Critical** = remote code execution for visitors · **High** = script execution under realistic conditions · **Medium** = weakens defence in depth or affects the build · **Low** = hygiene / limited blast radius.

---

## 2. Summary

| ID | Finding | Severity | Status |
|---|---|---|---|
| SEC-01 | Stored HTML injection through chapter JSON | **High** | **Fixed** (allowlist sanitizer at load) |
| SEC-02 | Attribute-context injection in the diagram fallback | **High** | **Fixed** |
| SEC-03 | Inline event handlers make a real CSP impossible | Medium | **Fixed** (delegated listeners, 0 inline handlers) |
| SEC-04 | No Content-Security-Policy or security headers | Medium | **Fixed** (meta CSP + strict-origin referrer) |
| SEC-05 | Known vulnerabilities in dev dependencies | Medium | **Partial** — `npm audit fix`: 18 moderate, 0 high (dev-only; Dependabot added) |
| SEC-06 | Third-party font request, no SRI, visitor IP disclosure | Low | **Fixed** (system font stacks, no Google Fonts) |
| SEC-07 | GitHub Actions pinned to mutable major tags | Low | **Fixed** (SHA-pinned in `.github/workflows/static.yml`) |
| SEC-08 | Deploy artifact publishes the entire repository | Low | **Fixed** (`dist/`-only staging, deploy from `dist/`) |
| SEC-09 | Content-controlled element IDs (DOM clobbering) | Low | **Fixed** (sanitizer strips `id`; only `class` survives) |
| SEC-10 | Quiz answer index not checked at runtime | Low | **Fixed** (`data-quiz-answer` + `validAnswer()` range check at load) |

No secrets, tokens, API keys or credentials are present in the repository (scanned: `.env`, PEM blocks, `api_key|secret|token|password`). The only `GITHUB_TOKEN` use is the workflow's scoped `pages:write` / `id-token:write` permissions.

---

## 3. Findings

### SEC-01 · Stored HTML injection through chapter JSON
**Severity:** High · **Status:** **Fixed** · **Class:** CWE-79 Stored XSS

**Evidence.** The renderer interpolates content fields directly into markup and assigns it with `innerHTML`:

```js
// index.html — block renderer
case 'p':     return `<p>${b.t}</p>`;
case 'concept': ... `${b.body}` ...
renderMCQ:    `<div class="opt ...">${o}</div>`
renderSQ:     `${q.a}`            // full answer HTML
```

Ten `innerHTML` sinks total (seven on `#page`, one on `#ch-list`, two on `#qcard`), and the HTML-bearing fields are `p.t`, `sub*`, `def.text`, `concept.body/items/eq/note`, `info.*`, `tip.t`, `error.*`, `eq.t`, `table.*`, `ul/ol.items`, `factors.*`, `trends.*`, `reactions.*`, `orbitals.*`, `qn-grid.*`, `qc.items`, `diagram.caption`, `mcq.q/opts/exp`, `sq.q/a`, `lq.*`, `quiz.q/opts/exp`.

**Impact.** A malicious chapter file can persist a payload for every visitor: credential phishing that mimics the site, redirects, crypto-mining, or defacement. There is no cookie to steal, which limits impact, but the site is used by students on shared devices and the brand is the owner's.

**Why it exists.** Inline HTML is the content format (`<strong>`, `<ul>`, `<div class="eq-block">`). Removing it wholesale would break 108k words of authoring.

**Remediation shipped.**
1. `assets/js/app.js` now renders through `sanitizeHtml` / `sanitizeDeep`: a DOM-based allowlist sanitizer (15 tags: `p, br, strong, em, b, i, u, s, sub, sup, small, ul, ol, li, div, span, table/thead/tbody/tr/th/td`); `class` is the only surviving attribute, so `on*`, `style`, `id`, `javascript:` URLs and `script`/`iframe`/`object`/`embed` are stripped before any `innerHTML` sink.
2. `chapters/*.json` is treated as a trust boundary: the validator rejects unknown blocks/paths before merge (PR review still required).
3. CSP from SEC-04 is live, so a missed payload cannot execute.
**Verification:** `<script>`, `onerror`, `style=` and `id=` are stripped by the sanitizer (covered in `__tests__/app.test.js` `describe('security')`); chapter JSON is sanitized deeply on load.

---

### SEC-02 · Attribute-context injection in the diagram fallback
**Severity:** High · **Status:** **Fixed** (commit `6e789b2`) · **Class:** CWE-79 / CWE-116

**Evidence (pre-fix).** `renderBlock` built an `onerror` attribute string with the caption interpolated, escaping only `"`:

```js
onerror="this.parentElement.innerHTML='<div ...>Diagram: ${(b.caption||b.file).replace(/"/g,"'")} ...</div>'"
```

`chapters/ch08.json` already contains a caption with `[A]<[B]`; a `>` or a crafted payload would have broken out of the attribute or the string and injected markup. jsdom confirmed the `<` opened a bogus tag and the caption escaped the wrapper.

**Fix.** The figure is now a semantic `<figure>`; `file`, `alt`, `number` and `section.id` go through `escAttr`; the fallback is a hidden `<div class="figure-missing">` toggled by a delegated `error` listener. No `onerror`, no string-built `innerHTML`, no escaping-by-replacement.

**Residual.** `caption` is still inserted as HTML inside `<figcaption>` (intentional, matches other content) and is covered by SEC-01.

---

### SEC-03 · Inline event handlers make a real CSP impossible
**Severity:** Medium · **Status:** **Fixed** · **Class:** CWE-1021 / CSP bypass facilitation

**Evidence (pre-fix).** Nine `onclick=` attributes in shipped markup and generated templates: overlay, menu button, scroll-to-top, sidebar links (`closeSidebar()`), short-question headers, quick-check headers, quiz options, quiz restart, "next".

**Fix.** `assets/js/app.js` was extracted from `index.html`; every handler moved to delegated listeners on `document`/`#page` keyed off `data-*` attributes (`data-action`, `data-sec`, `data-q`, etc.). `index.html` and `assets/js/app.js` contain **zero** inline handlers (`grep -c on[a-z]*=` → 0). The sanitizer strips any `on*` attribute that content might smuggle in.

**Result.** CSP can use `script-src 'self'` with no `'unsafe-inline'`; the blocker (extracting inline JS) is resolved.

---

### SEC-04 · No Content-Security-Policy or security headers
**Severity:** Medium · **Status:** **Fixed** · **Class:** CWE-693

**Fix.** `index.html` carries a strict meta CSP applied by GitHub Pages' HTML delivery:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

No `'unsafe-inline'`, no external origins, no third-party fonts — the font stack is system-only (SEC-06). Chapter JSON is fetched same-origin (`connect-src 'self'`). The policy blocks external scripts, framing, plugins and exfiltration to arbitrary hosts. Because SEC-03 removed all inline handlers/styles, no `'unsafe-inline'` exception is needed.

---

### SEC-05 · Known vulnerabilities in dev dependencies
**Severity:** Medium (dev-only) · **Status:** **Partial** · **Class:** CWE-1104 (unmaintained components)

`npm audit fix` ran against the committed lockfile: **18 moderate, 0 high, 0 critical** (down from 19 advisories with 7 high). The remaining 18 are moderate, dev-only advisories (jest / glob / minimatch / js-yaml transitive chains) with no offered fix that keeps `npm test` green.

**Why it is not Critical:** there is no runtime dependency; `node_modules` is never uploaded to Pages (the CI checkout does not install anything), and the affected packages run only on a contributor's machine against first-party code. `high` severity is eliminated, which was the re-audit merge block.

**Remediation shipped / in progress.**
- `npm audit fix` applied and `npm test` passes (27/27).
- `.github/dependabot.yml` added so the lockfile is re-audited weekly and this log does not rot (groups dev deps and GitHub Actions).
- Residual 18 moderate advisories are accepted as dev-only risk; re-audit blocks the merge only for `high` in packages that touch untrusted input.

---

### SEC-06 · Third-party font request, no SRI, visitor IP disclosure
**Severity:** Low · **Status:** **Fixed** · **Class:** CWE-829 (inclusion of functionality from untrusted control sphere), privacy

**Fix.** The Google Fonts link is removed entirely; the design system uses system font stacks (`Iowan Old Style → Palatino → Georgia` for serif, `ui-sans-serif / system-ui` for sans, mono for equations). Zero third-party requests, zero render-blocking font fetch, no visitor IP disclosure to a font origin.

---

### SEC-07 · GitHub Actions pinned to mutable major tags
**Severity:** Low · **Status:** **Fixed** · **Class:** CWE-1357 (mutable dependency)

**Fix.** Every `uses:` in `.github/workflows/static.yml` is pinned to a full commit SHA (checkout v4 `11d5960...`, setup-node v4 `49933ea...`, configure-pages v5 `983d773...`, upload-pages-artifact v4 `7b1f4a7...`, deploy-pages v4 `d6db901...`), each with the tag in a comment. Dependabot covers `github-actions` so pins stay current. Workflow permissions stay minimal (`contents: read`, `pages: write`, `id-token: write`).

---

### SEC-08 · Deploy artifact publishes the entire repository
**Severity:** Low · **Status:** **Fixed** · **Class:** CWE-200 (excessive exposure), hygiene

**Fix.** The deploy job stages a `dist/` directory containing only what Pages needs — `index.html`, `404.html`, `favicon.svg`, `assets/` and `chapters/` — and uploads that artifact instead of the repository root. `__tests__/`, `scripts/`, `docs/`, `.github/`, `package*.json` and the lockfile never ship. `npm run validate` (content report) runs in the gated `test` job before deploy, so a broken build blocks publication.

---

### SEC-09 · Content-controlled element IDs (DOM clobbering)
**Severity:** Low · **Status:** **Fixed** · **Class:** CWE-1321-adjacent / DOM clobbering

**Fix.** The sanitizer whitelist keeps only the `class` attribute — `id` (and every other attribute) is stripped from all content HTML before it reaches the DOM, so content can never clobber `getElementById` lookups (`#page`, `#qcard`, `#qscore`, `#ch-list`). Section anchors are rendered without content-supplied IDs.

---

### SEC-10 · Quiz answer index not checked at runtime
**Severity:** Low · **Status:** **Fixed** · **Class:** CWE-20 (improper input validation)

**Fix.** `renderQuiz` drops the answer into a `data-quiz-answer` attribute instead of interpolating it into an inline handler (`onclick="answerQuiz(this,${i},${q.ans})"` removed entirely — delegated listener reads `data-quiz-answer`). At load, `validAnswer()` checks `Number.isInteger(ans) && ans >= 0 && ans < opts.length`; out-of-range answers fail validation in `scripts/validate-content.mjs` too, so malformed data never ships and cannot execute code.

---

## 4. Positives worth keeping

- **No secrets** in the tree or history (single commit).
- **No external JavaScript**, no `eval`, no `document.write`, no `Function` constructor, no `postMessage`.
- **No storage, cookies, forms or auth** — nothing to steal and no session to forge.
- **Same-origin data** only; chapter JSON is parsed with `JSON.parse`, never evaluated.
- GitHub Pages serves over HTTPS.
- The deployment workflow uses narrow permissions (`contents: read`, `pages: write`, `id-token: write`).

## 5. Recommended order of work

| Priority | Action | Effort | Closes |
|---|---|---|---|
| 1 | Meta CSP + Referrer-Policy | 15 min | SEC-04 (partial) |
| 2 | `npm audit fix` + Dependabot | 1 h | SEC-05 |
| 3 | Attribute-escaping audit of every template (only figure/section are dynamic today) | 1 h | SEC-02 residual |
| 4 | HTML allowlist sanitizer at render | 3 h | SEC-01 |
| 5 | Extract inline JS → `assets/js/app.js`; remove inline handlers; strict CSP | 1 day | SEC-03, SEC-04 |
| 6 | Self-host fonts | 1 h | SEC-06 |
| 7 | Pin Actions + stage `dist/` | 1 h | SEC-07, SEC-08 |
| 8 | Namespace section IDs; validate `ans` at load | 2 h | SEC-09, SEC-10 |

## 6. Reproduce

```bash
npm audit --json | jq '.metadata.vulnerabilities'
grep -rnE "onclick=|onerror=|onload=" index.html
grep -c "innerHTML" index.html
grep -rnE "api[_-]?key|secret|token|password|BEGIN (RSA|OPENSSH|PRIVATE)" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude=package-lock.json .
grep -n "Content-Security-Policy\|integrity=" index.html   # 0 results
```
