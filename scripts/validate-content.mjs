#!/usr/bin/env node
/**
 * Content validator for the chemistry-notes static site.
 *
 * Usage:
 *   node scripts/validate-content.mjs            # report, exit 0
 *   node scripts/validate-content.mjs --strict   # exit 1 if any error
 *   node scripts/validate-content.mjs --json     # machine-readable
 *
 * No dependencies. Runs in CI before deploy.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const CHAPTERS = path.join(ROOT, 'chapters');
const args = new Set(process.argv.slice(2));
const STRICT = args.has('--strict');
const JSON_OUT = args.has('--json');

const errors = [];
const warnings = [];
const err = (file, loc, msg) => errors.push({ file, loc, msg });
const warn = (file, loc, msg) => warnings.push({ file, loc, msg });

/* ---------------------------------------------------------------- helpers */

const BLOCK_TYPES = {
  p: { required: ['t'] },
  subsec: { required: ['t'] },
  note: { required: ['t'] },
  deleted: { required: ['t'] },
  def: { required: ['text'] },
  concept: { required: ['head'] },
  info: { required: ['head'] },
  tip: { required: ['t'] },
  error: { required: ['wrong', 'correct', 'reason'] },
  eq: { required: ['t'] },
  table: { required: ['cols', 'rows'] },
  ul: { required: ['items'] },
  ol: { required: ['items'] },
  factors: { required: ['items'] },
  trends: { required: ['cards'] },
  reactions: { required: ['head', 'rxns'] },
  orbitals: { required: ['items'] },
  'qn-grid': { required: ['items'] },
  qc: { required: ['items'] },
  diagram: { required: ['file', 'alt'] }
};

const DIAGRAM_RE = /^assets\/diagrams\/(ch\d{2})\/(ch\d{2})_[a-z0-9][a-z0-9_-]*\.svg$/;
const LEGACY_RE = /^diagrams\/(.+)$/;
const TOP_LEVEL = new Set(['meta', 'sections', 'mcqs', 'sqs', 'lqs', 'quiz']);
const STATUSES = new Set(['ready', 'coming', 'deleted']);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

/* --------------------------------------------------------------- manifest */

const manifestPath = path.join(CHAPTERS, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('FATAL: chapters/manifest.json not found');
  process.exit(2);
}
const manifest = readJson(manifestPath);

if (!Array.isArray(manifest)) err('manifest.json', '', 'manifest must be an array');

const seenIds = new Set();
const ready = [];

for (const [i, entry] of (Array.isArray(manifest) ? manifest : []).entries()) {
  const loc = `[${i}] ${entry?.id ?? '?'}`;
  for (const key of ['id', 'num', 'title', 'short_title', 'status']) {
    if (!entry?.[key]) err('manifest.json', loc, `missing "${key}"`);
  }
  if (entry?.id) {
    if (seenIds.has(entry.id)) err('manifest.json', loc, `duplicate id "${entry.id}"`);
    seenIds.add(entry.id);
    if (!/^ch\d{2}$/.test(entry.id)) err('manifest.json', loc, `id must look like "ch03"`);
  }
  if (entry?.status && !STATUSES.has(entry.status)) {
    err('manifest.json', loc, `status "${entry.status}" not in ${[...STATUSES].join('/')}`);
  }
  if (entry?.status === 'deleted' && !entry.deleted) {
    err('manifest.json', loc, 'status "deleted" but deleted flag is not true');
  }
  if (entry?.status === 'ready') {
    ready.push(entry);
    if (!exists(`chapters/${entry.id}.json`)) {
      err('manifest.json', loc, `status "ready" but chapters/${entry.id}.json is missing`);
    }
    if (entry.deleted) err('manifest.json', loc, 'status "ready" but deleted flag is true');
  }
}

/* --------------------------------------------------------------- chapters */

let totals = { mcq: 0, sq: 0, lq: 0, quiz: 0, figures: 0, figuresMissing: 0 };

for (const entry of ready) {
  const file = `chapters/${entry.id}.json`;
  if (!exists(file)) continue;

  let data;
  try {
    data = readJson(path.join(ROOT, file));
  } catch (e) {
    err(file, '', `invalid JSON: ${e.message}`);
    continue;
  }

  // Unknown top-level keys are almost always silent content loss (e.g. "saqs").
  for (const key of Object.keys(data)) {
    if (!TOP_LEVEL.has(key)) {
      err(file, key, `unknown top-level key "${key}" — renderer will ignore it (content loss)`);
    }
  }
  if (data.saqs) err(file, 'saqs', `use "sqs" — "saqs" is not read by the renderer`);

  const meta = data.meta || {};
  if (!meta.id) err(file, 'meta.id', 'missing');
  if (!meta.title) err(file, 'meta.title', 'missing');
  if (meta.id && meta.id !== entry.id) {
    err(file, 'meta.id', `"${meta.id}" does not match filename "${entry.id}"`);
  }
  if (meta.number != null && String(meta.number).padStart(2, '0') !== String(entry.num).padStart(2, '0')) {
    err(file, 'meta.number', `"${meta.number}" does not match manifest num "${entry.num}"`);
  }
  if (!meta.exam_info) warn(file, 'meta.exam_info', 'missing');

  // exam mapping drift: manifest.exam_line vs meta.exam_info
  const norm = (s) => String(s || '').toLowerCase().replace(/questions?/g, 'q').replace(/[^a-z0-9]/g, '');
  if (entry.exam_line && meta.exam_info && norm(entry.exam_line) !== norm(meta.exam_info)) {
    warn(file, 'meta.exam_info', 'differs from manifest.exam_line (two sources of truth)');
  }

  /* sections & blocks */
  if (!Array.isArray(data.sections) || !data.sections.length) {
    err(file, 'sections', 'missing or empty');
  }
  const seenNumbers = new Set();
  const seenSectionIds = new Set();

  for (const [si, sec] of (data.sections || []).entries()) {
    const sLoc = `sections[${si}] ${sec.number ?? '?'}`;
    if (!sec.number) err(file, sLoc, 'missing "number"');
    if (!sec.title) err(file, sLoc, 'missing "title"');
    if (sec.number) {
      if (seenNumbers.has(sec.number)) err(file, sLoc, `duplicate section number "${sec.number}"`);
      seenNumbers.add(sec.number);
    }
    if (sec.id) {
      if (seenSectionIds.has(sec.id)) err(file, sLoc, `duplicate section id "${sec.id}"`);
      seenSectionIds.add(sec.id);
    }
    if (!Array.isArray(sec.blocks)) {
      warn(file, sLoc, 'no blocks array');
      continue;
    }

    for (const [bi, b] of sec.blocks.entries()) {
      const bLoc = `${sLoc}.blocks[${bi}]`;
      if (!b || typeof b !== 'object') { err(file, bLoc, 'block is not an object'); continue; }
      const spec = BLOCK_TYPES[b.type];
      if (!spec) { err(file, bLoc, `unknown block type "${b.type}" (renders as nothing)`); continue; }
      for (const key of spec.required) {
        if (b[key] == null || b[key] === '') err(file, bLoc, `${b.type}: missing "${key}"`);
      }

      if (b.type === 'diagram') {
        totals.figures++;
        const ref = String(b.file || '');
        const m = ref.match(DIAGRAM_RE);
        if (LEGACY_RE.test(ref)) {
          err(file, bLoc, `legacy path "${ref}" — expected assets/diagrams/${entry.id}/${entry.id}_<slug>.svg`);
        } else if (!m) {
          err(file, bLoc, `path "${ref}" does not match assets/diagrams/chXX/chXX_<slug>.svg`);
        } else if (m[1] !== m[2]) {
          err(file, bLoc, `folder "${m[1]}" does not match file prefix "${m[2]}"`);
        } else if (m[1] !== entry.id) {
          err(file, bLoc, `figure lives in ${m[1]} but is referenced from ${entry.id}`);
        }
        if (ref && !exists(ref)) {
          totals.figuresMissing++;
          err(file, bLoc, `missing asset: ${ref}`);
        }
        if (!b.alt || /^diagram$/i.test(String(b.alt).trim())) {
          err(file, bLoc, 'diagram: "alt" must describe the chemistry');
        }
        for (const field of ['alt', 'caption']) {
          if (b[field] && /["<]/.test(b[field])) {
            warn(file, bLoc, `diagram.${field} contains a quote or "<" — must be escaped when rendered`);
          }
        }
      }

      if (b.type === 'table') {
        if (!Array.isArray(b.cols) || !Array.isArray(b.rows)) {
          err(file, bLoc, 'table: cols and rows must be arrays');
        } else {
          b.rows.forEach((r, ri) => {
            if (r.length !== b.cols.length) {
              err(file, bLoc, `table: row ${ri} has ${r.length} cells, expected ${b.cols.length}`);
            }
          });
        }
      }
    }
  }

  /* questions */
  const mcqs = Array.isArray(data.mcqs) ? data.mcqs : [];
  totals.mcq += mcqs.length;
  if (!mcqs.length) warn(file, 'mcqs', 'no MCQs');

  const seenQuestions = new Set();
  mcqs.forEach((q, qi) => {
    const loc = `mcqs[${qi}]`;
    if (!q.q) err(file, loc, 'missing question text');
    if (!Array.isArray(q.opts) || q.opts.length !== 4) {
      err(file, loc, `expected exactly 4 options, got ${q.opts?.length ?? 0}`);
    }
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) {
      err(file, loc, `ans must be 0..3, got ${JSON.stringify(q.ans)}`);
    }
    if (!q.exp) warn(file, loc, 'missing explanation');
    const key = String(q.q || '').trim().toLowerCase();
    if (key && seenQuestions.has(key)) warn(file, loc, 'duplicate question text');
    seenQuestions.add(key);
  });

  const sqs = Array.isArray(data.sqs) ? data.sqs : [];
  totals.sq += sqs.length;
  sqs.forEach((q, qi) => {
    if (!q.q) err(file, `sqs[${qi}]`, 'missing question text');
    if (!q.a) err(file, `sqs[${qi}]`, 'missing answer');
  });

  const lqs = Array.isArray(data.lqs) ? data.lqs : [];
  totals.lq += lqs.length;
  lqs.forEach((q, qi) => {
    const loc = `lqs[${qi}]`;
    if (!q.q) err(file, loc, 'missing question text');
    if (!Array.isArray(q.parts) || !q.parts.length) {
      err(file, loc, 'missing parts');
    } else {
      q.parts.forEach((p, pi) => {
        if (!Array.isArray(p.points) || !p.points.length) {
          err(file, `${loc}.parts[${pi}]`, 'missing points');
        }
      });
    }
  });

  const quiz = Array.isArray(data.quiz) ? data.quiz : [];
  totals.quiz += quiz.length;
  quiz.forEach((q, qi) => {
    const loc = `quiz[${qi}]`;
    if (!q.q) err(file, loc, 'missing question text');
    if (!Array.isArray(q.opts) || q.opts.length !== 4) {
      err(file, loc, `expected 4 options, got ${q.opts?.length ?? 0}`);
    }
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) {
      err(file, loc, `ans must be 0..3, got ${JSON.stringify(q.ans)}`);
    }
    if (seenQuestions.has(String(q.q || '').trim().toLowerCase())) {
      warn(file, loc, 'duplicates an MCQ question');
    }
  });
}

/* ---------------------------------------------------------------- report */

const byFile = (list) => list.reduce((acc, e) => {
  (acc[e.file] ||= []).push(e);
  return acc;
}, {});

if (JSON_OUT) {
  console.log(JSON.stringify({ totals, errors, warnings }, null, 2));
} else {
  const line = '─'.repeat(64);
  console.log(`\nchemistry-notes content validation\n${line}`);
  console.log(`chapters  ${ready.length} ready`);
  console.log(`questions ${totals.mcq} MCQ · ${totals.sq} SQ · ${totals.lq} LQ · ${totals.quiz} quiz`);
  console.log(`figures   ${totals.figures - totals.figuresMissing}/${totals.figures} present`);

  if (errors.length) {
    console.log(`\n${line}\nERRORS (${errors.length})\n${line}`);
    for (const [file, list] of Object.entries(byFile(errors))) {
      console.log(`\n${file}`);
      for (const e of list.slice(0, 12)) console.log(`  ! ${e.loc}: ${e.msg}`);
      if (list.length > 12) console.log(`  ... ${list.length - 12} more`);
    }
  }

  if (warnings.length) {
    console.log(`\n${line}\nWARNINGS (${warnings.length})\n${line}`);
    const sample = Object.entries(byFile(warnings)).slice(0, 6);
    for (const [file, list] of sample) {
      console.log(`\n${file}`);
      for (const w of list.slice(0, 6)) console.log(`  ~ ${w.loc}: ${w.msg}`);
      if (list.length > 6) console.log(`  ... ${list.length - 6} more`);
    }
    if (Object.keys(byFile(warnings)).length > 6) console.log('\n  ... more files omitted');
  }

  console.log(`\n${line}`);
  console.log(errors.length ? `FAILED: ${errors.length} errors, ${warnings.length} warnings`
    : `PASS: 0 errors, ${warnings.length} warnings`);
  console.log(STRICT ? 'mode: strict (errors are fatal)\n' : 'mode: report (use --strict in CI)\n');
}

process.exit(STRICT && errors.length ? 1 : 0);
