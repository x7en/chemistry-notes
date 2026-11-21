// ─── STATE ────────────────────────────────────────────────
let manifest = [];
let currentChapter = null;
let _chapterRequest = null;

// ─── TEXT SAFETY ──────────────────────────────────────────
function escAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Content is authored as a small HTML subset. Everything else is stripped.
const SAFE_TAGS = new Set([
  'P', 'BR', 'STRONG', 'EM', 'B', 'I', 'U', 'S', 'SMALL', 'SUB', 'SUP',
  'UL', 'OL', 'LI', 'DIV', 'SPAN', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH',
  'TD', 'BLOCKQUOTE', 'CODE', 'PRE'
]);

function cleanNode(node) {
  for (const el of Array.from(node.children)) {
    if (!SAFE_TAGS.has(el.tagName)) { el.remove(); continue; }
    for (const attr of Array.from(el.attributes)) {
      if (attr.name !== 'class') el.removeAttribute(attr.name);
    }
    cleanNode(el);
  }
}

function sanitizeHtml(value) {
  const str = String(value == null ? '' : value);
  if (str.indexOf('<') === -1) return str;
  const doc = new DOMParser().parseFromString('<body>' + str + '</body>', 'text/html');
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeDeep(value) {
  if (typeof value === 'string') return value.indexOf('<') === -1 ? value : sanitizeHtml(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = sanitizeDeep(value[i]);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = sanitizeDeep(value[key]);
    return value;
  }
  return value;
}

// ─── INIT ─────────────────────────────────────────────────
async function init() {
  bindChrome();
  try {
    const res = await fetch('chapters/manifest.json');
    if (!res.ok) throw new Error('manifest.json responded ' + res.status);
    manifest = await res.json();
    renderSidebar();
    router();
    window.addEventListener('hashchange', router);
  } catch (e) {
    document.getElementById('page').innerHTML =
      '<div class="error-page"><h3>Could not load the chapter list</h3>' +
      '<p>chapters/manifest.json is missing or unreadable.</p></div>';
  }
}

// ─── ROUTER ───────────────────────────────────────────────
function router() {
  const hash = location.hash.replace('#', '');
  if (!hash || hash === 'home') {
    renderHome();
    return;
  }
  const ch = manifest.find(c => c.id === hash);
  if (ch) loadChapter(ch);
  else renderHome();
}

// ─── SIDEBAR ──────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById('ch-list');
  const retained = manifest.filter(c => !c.deleted);
  const deleted = manifest.filter(c => c.deleted);

  let html = '<p class="ch-group-label">Retained Chapters</p>';
  retained.forEach(ch => {
    html += `<a class="ch-item ${ch.hot ? 'hot' : ''}" href="#${escAttr(ch.id)}">
      <span class="ch-num">${escHtml(ch.num)}</span>
      <span class="ch-name">${escHtml(ch.short_title)}</span>
      ${ch.hot ? '<span class="ch-hot">High</span>' : ''}
    </a>`;
  });

  if (deleted.length) {
    const first = deleted[0].num, last = deleted[deleted.length - 1].num;
    const label = first === last ? `Deleted (Ch ${first})` : `Deleted (Ch ${first}–${last})`;
    html += `<p class="ch-group-label">${escHtml(label)}</p>`;
    deleted.forEach(ch => {
      html += `<a class="ch-item is-deleted" href="#${escAttr(ch.id)}" tabindex="-1" aria-disabled="true">
        <span class="ch-num">${escHtml(ch.num)}</span>
        <span class="ch-name">${escHtml(ch.short_title)}</span>
      </a>`;
    });
  }

  nav.innerHTML = html;

  const footer = document.getElementById('sidebar-footer');
  if (footer) {
    const readyCount = retained.filter(c => c.status === 'ready').length;
    footer.textContent = `${retained.length} retained · ${readyCount} available · ${deleted.length} deleted`;
  }
}

function updateActiveNav(id) {
  document.querySelectorAll('.ch-item').forEach(el => {
    el.classList.toggle('active', !!id && el.getAttribute('href') === '#' + id);
  });
}

function toggleSidebar() {
  const open = document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show', open);
  const btn = document.getElementById('menu-btn');
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  const btn = document.getElementById('menu-btn');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

// ─── THEME ────────────────────────────────────────────────
function setAccent(name) {
  if (['burgundy', 'forest', 'indigo', 'plum'].indexOf(name) === -1) return;
  document.documentElement.setAttribute('data-accent', name);
  try { localStorage.setItem('chem.accent', name); } catch (e) { /* ignore */ }
  syncThemeControls();
}

function setMode(mode) {
  if (mode !== 'light' && mode !== 'dark') return;
  document.documentElement.setAttribute('data-mode', mode);
  try { localStorage.setItem('chem.mode', mode); } catch (e) { /* ignore */ }
  syncThemeControls();
}

function syncThemeControls() {
  const root = document.documentElement;
  const accent = root.getAttribute('data-accent') || 'burgundy';
  const mode = root.getAttribute('data-mode') || 'light';

  document.querySelectorAll('[data-accent-set]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.getAttribute('data-accent-set') === accent));
  });
  document.querySelectorAll('[data-mode-set]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.getAttribute('data-mode-set') === mode));
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const accentColour = getComputedStyle(root).getPropertyValue('--accent').trim();
    meta.setAttribute('content', mode === 'dark' ? '#14120e' : (accentColour || '#8e1b33'));
  }
}

// ─── HOME PAGE ────────────────────────────────────────────
function renderHome() {
  if (_chapterRequest) { _chapterRequest.abort(); _chapterRequest = null; }
  currentChapter = null;
  document.title = 'FSc Chemistry XI — BISE Bahawalpur';
  setTopbarTitle('Home');
  updateActiveNav('');

  const retained = manifest.filter(c => !c.deleted);
  const cards = retained.map(ch => `
    <a class="ch-card ${ch.status === 'coming' ? 'is-coming' : ''}" href="#${escAttr(ch.id)}">
      <span class="cc-num">Chapter ${escHtml(ch.num)}</span>
      <span class="cc-title">${escHtml(ch.title)}</span>
      <span class="cc-meta">${ch.hot ? '<span class="tag">High weightage</span>' : ''}${escHtml(ch.exam_line || '')}${ch.status === 'coming' ? ' · Coming soon' : ''}</span>
    </a>`).join('');

  const stats = [
    { t: '17 MCQs', hot: false },
    { t: '2 MCQs from Ch 1, 6, 10', hot: true },
    { t: '5 long questions', hot: false },
    { t: '85 total marks', hot: false },
    { t: 'Q2–Q4 short questions', hot: false }
  ];

  document.getElementById('page').innerHTML = `
    <div class="home-page">
      <header class="home-hero">
        <p class="eyebrow">BISE Bahawalpur · Smart syllabus</p>
        <h1>FSc Chemistry <em>XI</em></h1>
        <p class="lede">Chapters 1–14 with board-style MCQs, short and long questions, concept builders, worked diagrams and flagged textbook corrections.</p>
        <ul class="stats-row">
          ${stats.map(s => `<li class="stat-pill ${s.hot ? 'is-hot' : ''}">${escHtml(s.t)}</li>`).join('')}
        </ul>
      </header>
      <section aria-labelledby="retained-heading">
        <h2 class="section-label" id="retained-heading">Retained chapters</h2>
        <div class="ch-grid">${cards}</div>
      </section>
    </div>`;
}

function setTopbarTitle(text) {
  const el = document.getElementById('topbar-title');
  if (el) el.textContent = text;
}

// ─── LOAD CHAPTER ─────────────────────────────────────────
async function loadChapter(chMeta) {
  if (_chapterRequest) _chapterRequest.abort();
  const controller = new AbortController();
  _chapterRequest = controller;

  document.getElementById('page').innerHTML = '<p class="loading">Loading chapter</p>';
  updateActiveNav(chMeta.id);
  setTopbarTitle(`Ch ${chMeta.num}`);

  if (chMeta.deleted || chMeta.status === 'deleted') {
    document.title = `Ch ${chMeta.num} · Deleted`;
    document.getElementById('page').innerHTML =
      `<div class="error-page"><h3>Deleted from the syllabus</h3>` +
      `<p>Chapter ${escHtml(chMeta.num)} (${escHtml(chMeta.title || chMeta.short_title)}) is not part of the smart syllabus.</p></div>`;
    window.scrollTo(0, 0);
    return;
  }

  if (chMeta.status === 'coming') {
    document.title = `Ch ${chMeta.num} · Coming soon`;
    document.getElementById('page').innerHTML =
      `<div class="error-page"><h3>Coming soon</h3><p>Chapter ${escHtml(chMeta.num)} is being prepared.</p></div>`;
    window.scrollTo(0, 0);
    return;
  }

  try {
    const res = await fetch(`chapters/${chMeta.id}.json`, { signal: controller.signal });
    if (controller.signal.aborted) return;
    if (!res.ok) throw new Error('404');
    const data = sanitizeDeep(await res.json());
    if (controller.signal.aborted) return;

    currentChapter = data;
    document.title = `Ch ${chMeta.num} · ${data.meta.title}`;
    document.getElementById('page').innerHTML = renderChapter(data);
    setupInteractivity();
    if (data.quiz) initQuiz();
    window.scrollTo(0, 0);
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    console.error('Chapter render failed:', e);
    document.getElementById('page').innerHTML =
      `<div class="error-page"><h3>Chapter not available</h3><p>chapters/${escAttr(chMeta.id)}.json could not be loaded.</p></div>`;
  }
}

// ─── CHAPTER RENDERER ─────────────────────────────────────
function renderChapter(data) {
  const m = data.meta || {};
  let html = '<div class="ch-page">';

  html += `<header class="ch-header">
    <p class="ch-tag">Chapter ${String(m.number ?? '').padStart(2, '0')}</p>
    <h1>${m.title || ''}</h1>
    ${m.exam_info ? `<p class="wt-badge"><span class="wt-label">Exam weightage</span>${m.exam_info}</p>` : ''}
    ${m.deleted ? `<p class="deleted-bar">${m.deleted}</p>` : ''}
    ${m.notes_merged ? `<p class="notes-merged">${m.notes_merged}</p>` : ''}
  </header>`;

  if (data.sections) data.sections.forEach(sec => { html += renderSection(sec); });

  if (data.mcqs && data.mcqs.length) {
    html += `<section class="mcq-section" aria-labelledby="mcq-heading">
      <h2 class="group-title" id="mcq-heading">MCQs <span class="group-count">${data.mcqs.length}</span></h2>`;
    data.mcqs.forEach((q, i) => { html += renderMCQ(q, i); });
    html += '</section>';
  }

  if (data.sqs && data.sqs.length) {
    html += `<section class="sq-section" aria-labelledby="sq-heading">
      <h2 class="group-title" id="sq-heading">Short questions <span class="group-count">${data.sqs.length}</span></h2>`;
    data.sqs.forEach((q, i) => { html += renderSQ(q, i); });
    html += '</section>';
  }

  if (data.lqs && data.lqs.length) {
    html += `<section class="lq-section" aria-labelledby="lq-heading">
      <h2 class="group-title" id="lq-heading">Long questions <span class="group-count">${data.lqs.length}</span></h2>`;
    data.lqs.forEach(q => { html += renderLQ(q); });
    html += '</section>';
  }

  if (data.quiz && data.quiz.length) {
    html += `<section class="quiz-section" id="quiz-section" aria-labelledby="quiz-heading">
      <h2 class="group-title" id="quiz-heading">Practice quiz <span class="group-count">${data.quiz.length}</span></h2>
      <p class="quiz-score-bar" id="qscore" aria-live="polite">Score: 0 / ${data.quiz.length}</p>
      <div id="qcard"></div>
    </section>`;
  }

  html += '</div>';
  return html;
}

// ─── SECTION RENDERER ─────────────────────────────────────
function renderSection(sec) {
  let html = `<section class="section"${sec.id ? ` id="s-${escAttr(sec.id)}"` : ''}>`;
  html += `<h2 class="section-title"><span class="sec-num">${escHtml(sec.number)}</span>${escHtml(sec.title)}</h2>`;
  if (sec.blocks) sec.blocks.forEach(b => { html += renderBlock(b); });
  html += '</section>';
  return html;
}

// ─── BLOCK RENDERER ───────────────────────────────────────
function renderBlock(b) {
  switch (b.type) {

    case 'p':
      return `<p>${b.t}</p>`;

    case 'subsec':
      return `<h3 class="subsec-title">${b.t}</h3>`;

    case 'note':
      return `<p class="note-tag">${b.t}</p>`;

    case 'deleted':
      return `<p class="deleted-bar">${b.t}</p>`;

    case 'def':
      return `<aside class="def-box">
        <p class="card-label">${escHtml(b.label || 'Definition')}</p>
        <p class="dt">“${b.text}”</p>
        ${b.src ? `<p class="ds">${b.src}</p>` : ''}
      </aside>`;

    case 'concept':
      return `<aside class="concept-box">
        <p class="card-label">Concept build — ${escHtml(b.head)}</p>
        ${b.body ? `<p>${b.body}</p>` : ''}
        ${b.items ? `<ul>${b.items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
        ${b.eq ? `<div class="eq-block">${b.eq}</div>` : ''}
        ${b.note ? `<p>${b.note}</p>` : ''}
      </aside>`;

    case 'info':
      return `<aside class="info-box">
        <p class="card-label">${escHtml(b.head || 'Note')}</p>
        ${b.body ? `<p>${b.body}</p>` : ''}
        ${b.items ? `<ul>${b.items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
      </aside>`;

    case 'tip':
      return `<aside class="tip-box">
        <p class="card-label">Exam tip</p>
        <p>${b.t}</p>
      </aside>`;

    case 'error':
      return `<aside class="error-box">
        <p class="card-label">${escHtml(b.head || 'Book error')}</p>
        <p class="ew"><span class="mini-label">Book says</span>${b.wrong}</p>
        <p class="ec"><span class="mini-label">Correct</span>${b.correct}</p>
        <p class="er"><span class="mini-label">Why</span>${b.reason}</p>
      </aside>`;

    case 'eq':
      return `<div class="eq-block">${b.t}</div>`;

    case 'table':
      return `<div class="table-wrap"><table>
        <thead><tr>${b.cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`;

    case 'ul':
      return `<ul>${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`;

    case 'ol':
      return `<ol>${b.items.map(i => `<li>${i}</li>`).join('')}</ol>`;

    case 'factors':
      return `<ol class="factor-list">${b.items.map((f, i) => `
        <li><span class="fn">${f.num || i + 1}</span><strong>${f.title}</strong>${f.body}</li>`).join('')}
      </ol>`;

    case 'trends':
      return `<div class="trend-grid">${b.cards.map(c => `
        <div class="trend-card">
          <p class="tc-p">${c.prop}</p>
          ${c.across ? `<p class="tc-a">${c.across}</p>` : ''}
          ${c.across_note ? `<p class="tc-note">${c.across_note}</p>` : ''}
          ${c.down ? `<p class="tc-d">${c.down}</p>` : ''}
          ${c.down_note ? `<p class="tc-note">${c.down_note}</p>` : ''}
          ${c.body ? `<p class="tc-body">${c.body}</p>` : ''}
        </div>`).join('')}
      </div>`;

    case 'reactions':
      return `<aside class="rxn-box">
        <p class="rh">${b.head}</p>
        ${b.rxns.map(r => `<div class="rxn">${r.eq}${r.note ? `<span class="rn">${r.note}</span>` : ''}</div>`).join('')}
      </aside>`;

    case 'orbitals':
      return `<div class="orbital-grid">${b.items.map(o => `
        <div class="orb-card">
          <p class="os">${o.sym}</p>
          <p class="osh">${o.shape}</p>
          <p>${o.body}</p>
        </div>`).join('')}
      </div>`;

    case 'qn-grid':
      return `<div class="qn-grid">${b.items.map(q => `
        <div class="qn-card">
          <p class="qn">${q.name}</p>
          <p class="qs">${q.sym}</p>
          <p>${q.body}</p>
          <p class="qv">${q.vals}</p>
          ${q.note ? `<p class="tc-note">${q.note}</p>` : ''}
        </div>`).join('')}
      </div>`;

    case 'qc':
      return `<aside class="qc-wrap">
        <p class="qc-label">${escHtml(b.title || 'Quick check')}</p>
        ${(b.items || []).map((item, i) => `
          <div class="qc-item">
            <div class="qc-q" role="button" tabindex="0" aria-expanded="false" data-toggle="qc">
              <span class="qc-num">${escHtml(item.num || String.fromCharCode(97 + i))}</span>
              <span class="sq-text">${item.q}</span>
              <span class="chev" aria-hidden="true"></span>
            </div>
            <div class="qc-ans">${item.ans}</div>
          </div>`).join('')}
      </aside>`;

    case 'diagram': {
      const src = escAttr(b.file || '');
      const alt = escAttr(b.alt || 'Chemistry diagram');
      const hasDims = Number(b.width) > 0 && Number(b.height) > 0;
      const dims = hasDims ? ` width="${Number(b.width)}" height="${Number(b.height)}"` : '';
      const cap = b.caption || '';
      const num = b.number ? `<span class="figure-num">Fig. ${escAttr(b.number)}</span>` : '';
      const srcNote = b.source ? `<span class="figure-src">${b.source}</span>` : '';
      return `<figure class="figure" data-src="${src}">
        <img src="${src}" alt="${alt}"${dims} loading="lazy" decoding="async">
        <div class="figure-missing">This figure is being prepared.</div>
        ${cap || num || srcNote ? `<figcaption>${num}${cap}${srcNote}</figcaption>` : ''}
      </figure>`;
    }

    default:
      return '';
  }
}

// ─── MCQ RENDERER ─────────────────────────────────────────
function renderMCQ(q, i) {
  const letters = ['A', 'B', 'C', 'D'];
  const valid = Number.isInteger(q.ans) && q.ans >= 0 && q.ans < 4 ? q.ans : -1;
  return `<article class="mcq-item">
    <p class="mcq-q"><span class="qn">${escHtml(q.num || 'Q' + (i + 1))}</span>${q.src ? `<span class="src">${escHtml(q.src)}</span> ` : ''}${q.q}</p>
    <div class="mcq-opts">
      ${(q.opts || []).map((o, j) => `<div class="opt ${j === valid ? 'correct' : ''}">
        <span class="ol">${letters[j] || ''}</span><span>${o}</span>${j === valid ? '<span class="opt-mark">Answer</span>' : ''}
      </div>`).join('')}
    </div>
    ${q.exp ? `<p class="mcq-exp"><strong>Answer: ${letters[valid] || '—'}</strong> — ${q.exp}</p>` : ''}
  </article>`;
}

// ─── SHORT Q RENDERER ─────────────────────────────────────
function renderSQ(q, i) {
  return `<article class="sq-item">
    <div class="sq-q" role="button" tabindex="0" aria-expanded="false" data-toggle="sq">
      <span class="sq-qnum">${escHtml(q.num || 'Q' + (i + 1))}</span>
      <span class="sq-text">${q.q}</span>
      <span class="chev" aria-hidden="true"></span>
    </div>
    <div class="sq-ans">
      <p class="btag">${escHtml(q.tag || 'Board-style answer')}</p>
      ${q.a}
    </div>
  </article>`;
}

// ─── LONG Q RENDERER ──────────────────────────────────────
function renderLQ(q) {
  return `<article class="lq-item">
    <p class="lq-title">${q.title || 'Long question'}${q.marks ? `<span class="marks-badge">${escHtml(q.marks)}</span>` : ''}</p>
    <p class="lq-q">${q.q}</p>
    ${(q.parts || []).map(p => `
      <p class="lq-part-label">${p.label}</p>
      <ul class="lq-pts">${p.points.map(pt => `<li>${pt}</li>`).join('')}</ul>
    `).join('')}
  </article>`;
}

// ─── INTERACTIVITY ────────────────────────────────────────
function setupInteractivity() {
  scrollHandler();
}

function scrollHandler() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  btn.classList.toggle('show', window.scrollY > 420);
}

function toggleSQ(el) {
  const open = el.classList.toggle('open');
  el.setAttribute('aria-expanded', open ? 'true' : 'false');
  el.nextElementSibling.classList.toggle('show');
}

function toggleQC(el) {
  const open = el.classList.toggle('open');
  el.setAttribute('aria-expanded', open ? 'true' : 'false');
  el.nextElementSibling.classList.toggle('show');
}

function togglePanel(el) {
  if (el.getAttribute('data-toggle') === 'qc') toggleQC(el);
  else toggleSQ(el);
}

function onPageClick(e) {
  const target = e.target;

  const toggle = target.closest ? target.closest('[data-toggle]') : null;
  if (toggle) { togglePanel(toggle); return; }

  const answer = target.closest ? target.closest('[data-quiz-answer]') : null;
  if (answer) { answerQuiz(answer, Number(answer.getAttribute('data-quiz-answer'))); return; }

  if (target.closest && target.closest('[data-quiz-next]')) { nextQuiz(); return; }
  if (target.closest && target.closest('[data-quiz-restart]')) { initQuiz(); }
}

function onPageKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const toggle = e.target.closest ? e.target.closest('[data-toggle]') : null;
  if (!toggle) return;
  e.preventDefault();
  togglePanel(toggle);
}

function onImageError(e) {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || !img.closest) return;
  const fig = img.closest('.figure');
  if (fig) fig.classList.add('is-missing');
}

let _chromeBound = false;
function bindChrome() {
  if (_chromeBound) return;
  _chromeBound = true;

  const overlay = document.getElementById('overlay');
  const menu = document.getElementById('menu-btn');
  const scroll = document.getElementById('scroll-top');
  const list = document.getElementById('ch-list');
  const page = document.getElementById('page');

  if (overlay) overlay.addEventListener('click', closeSidebar);
  if (menu) menu.addEventListener('click', toggleSidebar);
  if (scroll) scroll.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  if (list) list.addEventListener('click', e => { if (e.target.closest('a.ch-item')) closeSidebar(); });

  if (page) {
    page.addEventListener('click', onPageClick);
    page.addEventListener('keydown', onPageKeydown);
    page.addEventListener('error', onImageError, true);
  }

  window.addEventListener('scroll', scrollHandler, { passive: true });

  document.querySelectorAll('[data-accent-set]').forEach(btn => {
    btn.addEventListener('click', () => setAccent(btn.getAttribute('data-accent-set')));
  });
  document.querySelectorAll('[data-mode-set]').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.getAttribute('data-mode-set')));
  });

  syncThemeControls();
}

// ─── QUIZ ENGINE ──────────────────────────────────────────
let _qz = { qs: [], idx: 0, score: 0 };

function validAnswer(q) {
  if (!q || !Array.isArray(q.opts)) return -1;
  const n = q.ans;
  return Number.isInteger(n) && n >= 0 && n < q.opts.length ? n : -1;
}

function initQuiz() {
  if (!currentChapter || !currentChapter.quiz) return;
  _qz = { qs: currentChapter.quiz, idx: 0, score: 0 };
  const bar = document.getElementById('qscore');
  if (bar) bar.textContent = `Score: 0 / ${_qz.qs.length}`;
  showQuizCard();
}

function showQuizCard() {
  const qcard = document.getElementById('qcard');
  if (!qcard) return;

  if (_qz.idx >= _qz.qs.length) {
    const pct = _qz.qs.length ? Math.round(_qz.score / _qz.qs.length * 100) : 0;
    const message = pct >= 80 ? 'Excellent — board-ready.'
      : pct >= 60 ? 'Good — review the weak spots.'
      : 'Keep revising — you have got this.';
    qcard.innerHTML = `<div class="quiz-card quiz-end">
      <p class="qe-score">${_qz.score} / ${_qz.qs.length}</p>
      <p>${message}</p>
      <button type="button" class="quiz-restart" data-quiz-restart>Try again</button>
    </div>`;
    return;
  }

  const q = _qz.qs[_qz.idx];
  const letters = ['A', 'B', 'C', 'D'];
  const opts = Array.isArray(q.opts) ? q.opts : [];

  qcard.innerHTML = `<div class="quiz-card">
    <p class="quiz-num">Question ${_qz.idx + 1} of ${_qz.qs.length}</p>
    <p class="quiz-q">${q.q}</p>
    <div class="quiz-opts">
      ${opts.map((o, i) => `<button type="button" class="quiz-opt" data-quiz-answer="${i}">
        <span class="ol">${letters[i] || ''}</span><span>${o}</span>
      </button>`).join('')}
    </div>
    <p class="quiz-exp" id="qexp">${q.exp || ''}</p>
    <button type="button" class="quiz-next" id="qnext" data-quiz-next>Next question</button>
  </div>`;
}

function answerQuiz(btn, chosen) {
  const q = _qz.qs[_qz.idx];
  const correct = validAnswer(q);
  const opts = btn.parentElement.querySelectorAll('.quiz-opt');
  opts.forEach(o => { o.disabled = true; });

  if (chosen === correct) {
    btn.classList.add('correct');
    _qz.score++;
  } else {
    btn.classList.add('wrong');
    if (correct >= 0 && opts[correct]) opts[correct].classList.add('reveal');
  }

  const exp = document.getElementById('qexp');
  if (exp) exp.classList.add('show');
  const next = document.getElementById('qnext');
  if (next) next.classList.add('show');
  const bar = document.getElementById('qscore');
  if (bar) bar.textContent = `Score: ${_qz.score} / ${_qz.qs.length}`;
}

function nextQuiz() {
  _qz.idx++;
  showQuizCard();
}

// ─── RUN ──────────────────────────────────────────────────
if (typeof window !== 'undefined' && !window.__CHEM_TEST__) init();
