---
version: alpha
name: Study Notebook
description: A warm paper-and-ink study system for FSc Chemistry notes — burgundy ink, butter highlights, dashed rules and uppercase labels, with four switchable accents and a night mode.
colors:
  paper: "#faf4e4"
  paper-muted: "#f4ecd8"
  surface: "#fffcf2"
  surface-muted: "#f8f1de"
  ink: "#423d24"
  ink-muted: "#655f3f"
  ink-subtle: "#756d4c"
  rule: "#ddd0b2"
  rule-strong: "#c9b995"
  primary: "#8e1b33"
  on-primary: "#fff8e8"
  highlight: "#f7efc2"
  highlight-strong: "#efe3a8"
  success: "#3f6b45"
  danger: "#9d3230"
  info-surface: "#eef0dd"
  success-surface: "#e8f0e2"
  danger-surface: "#f7e5e0"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.01em
  h1:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  h2:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: 27px
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 16.5px
    fontWeight: 400
    lineHeight: 1.7
  body-small:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.16em
    fontFeature: "uppercase"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.7
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
rounded:
  sm: 8px
  md: 12px
  lg: 14px
  pill: 999px
components:
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  sidebar:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.ink}"
  chapter-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  section-number:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  definition-callout:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  info-callout:
    backgroundColor: "{colors.info-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  error-callout:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
  table-header:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  answer-chip:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm}"
  nav-item-active:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  quiz-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  figure:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  meta-text:
    textColor: "{colors.ink-muted}"
  micro-label:
    textColor: "{colors.ink-subtle}"
  inset-panel:
    backgroundColor: "{colors.surface-muted}"
    rounded: "{rounded.sm}"
  divider:
    backgroundColor: "{colors.rule}"
    height: "1px"
  divider-strong:
    backgroundColor: "{colors.rule-strong}"
    height: "1px"
  weightage-badge:
    backgroundColor: "{colors.highlight-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
---

# Study Notebook

## Overview

Study Notebook is the visual language of a careful student's revision file: warm cream paper, deep burgundy ink, butter-yellow highlights, olive-black text and dashed rules that echo a hand-ruled margin. It is designed for long reading sessions on a phone at night as much as on a laptop, so the page stays quiet: one accent colour carries hierarchy, serif headings do the announcing, and uppercase micro-labels do the signposting.

The tone is *stationery, not dashboard*. No gradients, no glassmorphism, no emoji, no drop shadows beyond a single soft lift on cards. Structure comes from rules, whitespace and letter-spaced labels — the same tools a student uses with a ruler and a highlighter.

The system is intentionally themeable: four accent inks — **Burgundy** (default), **Forest**, **Indigo** and **Plum** — and two modes, **Paper** (light) and **Night** (dark). Content placement never changes between themes; only ink and highlight values do.

## Colors

- **Paper** `{colors.paper}` is the page itself, with a 1px dot grid at 8.5% ink for texture. Cards sit on **Surface** `{colors.surface}`, one step lighter, so they read as pasted-in index cards rather than floating panels.
- **Ink** `{colors.ink}` is a warm olive-black, not pure black; it keeps 10:1+ contrast on paper without the glare of #000. **Ink Muted** and **Ink Subtle** are for secondary copy and metadata only, never for body text.
- **Primary** `{colors.primary}` is the burgundy ink used for section numbers, table headers, chips and the active navigation bar. It is the only saturated colour in the default view.
- **Highlight** `{colors.highlight}` is butter yellow, reserved for things a student would actually highlight: definitions, exam tips, the active chapter, and the "quick check" panel.
- **Success / Warning / Danger** are muted so they read as stationery inks: an olive green for correct answers, ochre for caution, brick for corrections. Never use them decoratively.

Night mode inverts paper and ink while keeping the same accent family: surfaces become warm charcoal, highlights become deep olive-butter, and accent text lightens so it stays legible on dark. Figures always sit on a light plate in both modes, because diagrams are printed artefacts.

## Typography

Two families, no webfonts:

- **Serif** (system: Iowan Old Style → Palatino → Georgia) for chapter titles, section headings and long-question prompts. It gives the page its textbook voice.
- **Sans** (system UI stack) for body copy, labels, navigation and controls. Body text is 16.5px at 1.7 line-height, capped at 72 characters.
- **Mono** (system) only for equations and reaction strings, never for labels.

Labels are uppercase, 11px, weight 700, with 0.16em tracking. This is the signature of the reference notebook: `DEFINITION`, `EXAM WEIGHTAGE`, `CHAPTER 03`. Body copy is sentence case and never letter-spaced.

## Layout

A 300px sidebar holds the chapter index and the appearance controls; content is centred at a maximum of 900px with 28px gutters. Spacing follows a 4px base scale — 4, 8, 16, 24, 32, 48, 64 — and a reading measure of 72 characters for prose.

On screens below 900px the sidebar becomes an off-canvas drawer with a sticky top bar; below 620px all two-column grids (MCQ options, trends, orbitals, chapter cards) collapse to one column. Section anchors are prefixed `s-` so content cannot collide with application IDs.

## Elevation & Depth

Depth is deliberately flat. Cards carry a 1px rule and one soft shadow (`0 10px 30px -18px` ink at 35%) to separate them from the paper; nothing floats above anything else. Dashed borders signal "annotation" (definitions, figures, tables, callouts) while solid borders signal "container" (cards, items, panels). There are only two levels: page and card.

## Shapes

Two radii do most of the work: 8px for chips, options and small controls, 12–14px for cards and callouts; pills (999px) for buttons and badges. The chapter header uses a 4px accent bar on its left edge instead of a full accent fill, so the page keeps one dominant ink block. Circles are reserved for colour swatches, quiz scores and the scroll-to-top control.

## Components

- **Sidebar** — cream panel, dashed right rule, chapter numbers as burgundy chips. The active chapter gets a butter background and an accent bar; deleted chapters are struck through at 45% opacity and removed from the tab order.
- **Chapter header** — surface card with the accent bar, `CHAPTER 03` label, serif title, and a butter pill for exam weightage. Deleted-portion and merged-notes notices appear as dashed amber/brick strips.
- **Section heading** — serif title with a burgundy number chip, underlined by a dashed rule; subsections are uppercase accent labels.
- **Callouts** — one pattern, four meanings: definition (butter), concept (surface with accent spine), note (olive tint), exam tip (butter), book error (brick tint with `Book says / Correct / Why` rows). Each carries an uppercase label and no icon.
- **Questions** — MCQs are cards with lettered option chips; the correct option is olive-tinted with an `ANSWER` marker. Short questions are single collapsible cards with a chevron and `aria-expanded`; long questions carry a marks pill and numbered parts.
- **Quiz** — one card at a time, options as full-width buttons, feedback revealed after answering, score announced politely.
- **Figures** — always on a light paper plate with a dashed-free 1px border, numbered `FIG. 3.4`, caption beneath, and an honest "being prepared" state when the asset is absent.
- **Appearance controls** — four colour swatches plus a Paper/Night segmented switch, at the head of the sidebar, persisted locally.

## Do's and Don'ts

**Do**
- Use one accent per screen; let letter-spacing, weight and rules carry hierarchy.
- Keep labels uppercase at 11px/700/0.16em and body copy sentence case.
- Put definitions and exam tips on butter; put corrections on the brick tint.
- Respect `prefers-reduced-motion` and keep focus rings at 3px accent.
- Keep figures on a light plate in both modes, and reserve 640×400 as the default canvas.

**Don't**
- Don't introduce a second accent, gradient, glass effect or coloured shadow.
- Don't use emoji as icons; use labels or the three geometric marks (dot, chevron, bar).
- Don't set body copy below 16px or labels below 10px.
- Don't use colour alone to convey correctness — pair it with the `ANSWER` marker and the explanation line.
- Don't reflow content between themes; only tokens change.
