# FSc Chemistry XI — Study Notes
**BISE Bahawalpur · Smart Syllabus · Chapters 1–14**

Live site → deployed on GitHub Pages (see setup below)

---

## Repo Structure

```
/
├── index.html              ← The entire app (renderer + UI, never edit this)
├── chapters/
│   ├── manifest.json       ← Chapter list + metadata (edit to add/mark chapters)
│   ├── ch01.json           ← Chapter 1 data
│   ├── ch02.json           ← Chapter 2 data
│   └── ch03.json           ← (add future chapters here)
└── README.md
```

---

## GitHub Pages Setup (One Time)

1. Create a new **public** GitHub repo (e.g., `fsc-chemistry`)
2. Upload all files (keep folder structure intact):
   - `index.html` → root
   - `chapters/manifest.json` → inside `chapters/`
   - `chapters/ch01.json`, `chapters/ch02.json` → inside `chapters/`
3. Go to repo **Settings → Pages**
4. Under "Source" → select **Deploy from branch → main → / (root)**
5. Click Save. Wait ~1 minute.
6. Your site is live at: `https://YOUR_USERNAME.github.io/fsc-chemistry/`

---

## Adding a New Chapter (Per Chapter Workflow)

1. Receive `chXX.json` file from Claude
2. Upload it to the `chapters/` folder in your repo
3. In `chapters/manifest.json`, find the chapter entry and change `"status": "coming"` → `"status": "ready"`
4. Commit. GitHub Pages auto-deploys in ~30 seconds.

That's it. No build step, no npm, no terminal needed.

---

## manifest.json Fields

```json
{
  "id": "ch03",           ← must match the .json filename: chapters/ch03.json
  "num": "03",            ← display number
  "title": "Full chapter title",
  "short_title": "Short name for sidebar",
  "exam_line": "1 MCQ · Q3 Short Qs · Q6(a) Long Q",
  "hot": false,           ← true = shows ★★ (high weightage: Ch 1, 6, 10)
  "deleted": false,       ← true = grayed out in sidebar (Ch 15, 16)
  "status": "coming"      ← "ready" = loads ch03.json | "coming" = placeholder
}
```

---

## JSON Content Block Types Reference

Each section's `blocks` array accepts these types:

| `type` | Required fields | Notes |
|--------|----------------|-------|
| `p` | `t` (HTML string) | Paragraph |
| `subsec` | `t` | Subsection heading (teal) |
| `def` | `label`, `text`, `src?` | Definition box (teal border) |
| `concept` | `head`, `body?`, `items?[]`, `eq?`, `note?` | Concept build box (purple) |
| `info` | `head`, `body?`, `items?[]` | Info box (blue) |
| `tip` | `t` | Exam tip box (gold) |
| `error` | `head?`, `wrong`, `correct`, `reason` | Book error box (red) |
| `eq` | `t` (preformatted string) | Equation/code block |
| `table` | `cols[]`, `rows[][]` | Table |
| `ul` | `items[]` | Bullet list |
| `ol` | `items[]` | Numbered list |
| `factors` | `items[]{num, title, body}` | Factor list (numbered gold) |
| `trends` | `cards[]{prop, across?, across_note?, down?, down_note?, body?}` | 2-column trend grid |
| `reactions` | `head`, `rxns[]{eq, note?}` | Reaction equations box |
| `orbitals` | `items[]{sym, shape, body}` | Orbital shapes grid (3 cols) |
| `qn-grid` | `items[]{name, sym, body, vals, note?}` | Quantum number cards (2 cols) |
| `note` | `t` | Handwritten notes tag (teal badge) |
| `deleted` | `t` | Deleted notice (red bar) |

### MCQ format
```json
{
  "num": "Q1",
  "src": "Book III",
  "q": "Question text here?",
  "opts": ["Option A", "Option B", "Option C", "Option D"],
  "ans": 1,
  "exp": "Explanation text here."
}
```
`ans` = 0-indexed (0=A, 1=B, 2=C, 3=D)

### Short Question format
```json
{
  "num": "SAQ a",
  "q": "Question text?",
  "a": "<p>Answer HTML here. Can use <strong>, <ul>, <li>, <div class='eq-block'>...</div> etc.</p>",
  "tag": "BOARD STYLE ANSWER"
}
```

### Long Question format
```json
{
  "title": "Q5(a) — Chapter 2 Long Question",
  "marks": "4 marks",
  "q": "Full question text here.",
  "parts": [
    {
      "label": "PART 1 — Label here",
      "points": ["Bullet point 1", "Bullet point 2"]
    }
  ]
}
```

---

## Paper Structure (Quick Reference)

| Question | Chapters | Marks | Format |
|----------|----------|-------|--------|
| Objective | All (2 from Ch 1, 6, 10) | 17 | 17 MCQs |
| Q2 | Ch 1, 2, 7, 8, 13 | 16 | 8/12 short Qs |
| Q3 | Ch 3, 6, 9, 11, 14 | 16 | 8/12 short Qs |
| Q4 | Ch 4, 10, 12, 14 | 12 | 6/9 short Qs |
| Q5 | Ch 2(a), Ch 5(b) | 8 | Long Q |
| Q6 | Ch 3(a), Ch 7(b) | 8 | Long Q |
| Q7 | Ch 8(a), Ch 9(b) | 8 | Long Q |
| Q8 | Ch 11(a), Ch 14(b) | 8 | Long Q |
| Q9 | Ch 12(a), Ch 13(b) | 8 | Long Q |

---

*Built for Hex — KEMU MBBS pathway · boards in 2 months*
