// ─── STATE ────────────────────────────────────────────────
let manifest = [];
let currentChapter = null;
const THEME_KEY = 'chemistry-notes-theme';

// ─── THEME ─────────────────────────────────────────────────
function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch(e) {}
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.textContent = next === 'dark' ? '☀ Light' : '🌙 Dark';
    btn.setAttribute('aria-pressed', next === 'dark');
  });
}

function initTheme() {
  let starting = 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)') && window.matchMedia('(prefers-color-scheme: dark)').matches;
    starting = saved || (prefersDark ? 'dark' : 'light');
  } catch(e) {}
  setTheme(starting);
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  });
}

// ─── INIT ─────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('chapters/manifest.json');
    manifest = await res.json();
    renderSidebar();
    router();
    window.addEventListener('hashchange', router);
  } catch(e) {
    document.getElementById('page').innerHTML = `<div class="error-page"><h3>Could not load manifest.json</h3><p>Make sure chapters/manifest.json exists in your repo.</p></div>`;
  }
}

// ─── ROUTER ───────────────────────────────────────────────
function router() {
  const hash = location.hash.replace('#','');
  if (!hash || hash === 'home') {
    renderHome();
  } else {
    const ch = manifest.find(c => c.id === hash);
    if (ch) loadChapter(ch);
    else renderHome();
  }
}

// ─── SIDEBAR ──────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById('ch-list');
  const retained = manifest.filter(c => !c.deleted);
  const deleted  = manifest.filter(c => c.deleted);

  let html = `<div class="ch-group-label">Retained Chapters</div>`;
  retained.forEach(ch => {
    html += `<a class="ch-item ${ch.hot?'hot':''}" href="#${ch.id}" onclick="closeSidebar()">
      <span class="ch-num">${ch.num}</span>
      <span class="ch-name">${ch.short_title}</span>
      ${ch.hot ? '<span class="ch-hot">★★</span>' : ''}
    </a>`;
  });
  html += `<div class="ch-group-label" style="margin-top:8px;">Deleted (Ch 15–16)</div>`;
  deleted.forEach(ch => {
    html += `<a class="ch-item" style="opacity:.35;pointer-events:none;" href="#">
      <span class="ch-num" style="color:var(--text2)">${ch.num}</span>
      <span class="ch-name" style="text-decoration:line-through">${ch.short_title}</span>
    </a>`;
  });
  nav.innerHTML = html;
}

function updateActiveNav(id) {
  document.querySelectorAll('.ch-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === '#'+id);
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ─── HOME PAGE ────────────────────────────────────────────
function renderHome() {
  currentChapter = null;
  document.title = 'FSc Chemistry XI — BISE Bahawalpur';
  document.getElementById('topbar-title').textContent = 'Home';
  updateActiveNav('');

  const retained = manifest.filter(c => !c.deleted);
  let cards = retained.map(ch => `
    <a class="ch-card ${ch.status==='coming'?'deleted':''}" href="#${ch.id}">
      <div class="cc-num">Chapter ${ch.num}</div>
      <div class="cc-title">${ch.title}</div>
      <div class="cc-meta ${ch.hot?'cc-hot':''}">
        ${ch.hot?'★ ':''}${ch.exam_line || ''}
        ${ch.status==='coming'?'<span style="color:var(--text2)"> · Coming soon</span>':''}
      </div>
    </a>`).join('');

  const stats = [
    {t:'17 MCQs', hot:false},
    {t:'2 MCQs from Ch 1, 6, 10', hot:true},
    {t:'5 Long Questions', hot:false},
    {t:'85 Total Marks', hot:false},
    {t:'Q2/Q3/Q4 Short Qs', hot:false},
  ];

  document.getElementById('page').innerHTML = `
    <div class="home-page">
      <div class="home-hero">
        <div class="h-eyebrow">BISE Bahawalpur · Smart Syllabus</div>
        <h1>FSc Chemistry <em>XI</em></h1>
        <p>Chapters 1–14 · Board-style MCQs, Short Questions, Long Questions, Concept Builders, Book Error Flags</p>
        <div class="stats-row">
          ${stats.map(s=>`<span class="stat-pill ${s.hot?'hot':''}">${s.t}</span>`).join('')}
        </div>
      </div>
      <div class="section-label">Retained Chapters</div>
      <div class="ch-grid">${cards}</div>
    </div>`;
}

// ─── LOAD CHAPTER ─────────────────────────────────────────
async function loadChapter(chMeta) {
  document.getElementById('page').innerHTML = '<div class="loading">Loading chapter</div>';
  updateActiveNav(chMeta.id);
  document.getElementById('topbar-title').textContent = `Ch ${chMeta.num}`;

  if (chMeta.status === 'coming') {
    document.getElementById('page').innerHTML = `<div class="error-page"><h3>Coming Soon</h3><p>Chapter ${chMeta.num} notes are being prepared.</p></div>`;
    return;
  }

  try {
    const res = await fetch(`chapters/${chMeta.id}.json`);
    if (!res.ok) throw new Error('404');
    const data = await res.json();
    currentChapter = data;
    document.title = `Ch ${chMeta.num} · ${data.meta.title}`;
    document.getElementById('page').innerHTML = renderChapter(data);
    setupInteractivity();
    window.scrollTo(0,0);
  } catch(e) {
    document.getElementById('page').innerHTML = `<div class="error-page"><h3>Chapter not yet available</h3><p>chapters/${chMeta.id}.json not found.</p></div>`;
  }
}

// ─── CHAPTER RENDERER ─────────────────────────────────────
function renderChapter(data) {
  const m = data.meta;
  let html = `<div class="ch-page">`;

  // Header
  html += `<div class="ch-header">
    <div class="ch-tag">Chapter ${m.number.toString().padStart(2,'0')}</div>
    <h2>${m.title}</h2>
    <div class="wt-badge">🎯 ${m.exam_info}</div>
    ${m.deleted ? `<div class="deleted-bar">🗑 DELETED: ${m.deleted}</div>` : ''}
    ${m.notes_merged ? `<div style="background:rgba(59,191,184,0.07);border:1px solid rgba(59,191,184,0.2);border-radius:6px;padding:8px 12px;font-family:var(--mono);font-size:10px;color:var(--teal);margin-top:8px;">✎ ${m.notes_merged}</div>` : ''}
  </div>`;

  // Sections
  if (data.sections) {
    data.sections.forEach(sec => {
      html += renderSection(sec);
    });
  }

  // MCQs
  if (data.mcqs && data.mcqs.length) {
    html += `<div class="mcq-section"><h3>MCQs — ${m.title}</h3>`;
    data.mcqs.forEach((q,i) => { html += renderMCQ(q, i); });
    html += `</div>`;
  }

  // Short Questions
  if (data.sqs && data.sqs.length) {
    html += `<div class="sq-section"><h3>Short Questions</h3>`;
    data.sqs.forEach((q,i) => { html += renderSQ(q, i); });
    html += `</div>`;
  }

  // Long Questions
  if (data.lqs && data.lqs.length) {
    html += `<div class="lq-section"><h3>Long Questions</h3>`;
    data.lqs.forEach(q => { html += renderLQ(q); });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ─── SECTION RENDERER ─────────────────────────────────────
function renderSection(sec) {
  let html = `<div class="section" id="${sec.id || ''}">`;
  html += `<div class="section-title"><span class="sec-num">${sec.number}</span>${sec.title}</div>`;
  if (sec.blocks) sec.blocks.forEach(b => { html += renderBlock(b); });
  html += `</div>`;
  return html;
}

// ─── BLOCK RENDERER ───────────────────────────────────────
function renderBlock(b) {
  switch(b.type) {

    case 'p':
      return `<p>${b.t}</p>`;

    case 'subsec':
      return `<div class="subsec-title">${b.t}</div>`;

    case 'note':
      return `<div class="note-tag">✎ From Notes: ${b.t}</div>`;

    case 'deleted':
      return `<div class="deleted-bar">${b.t}</div>`;

    case 'def':
      return `<div class="def-box">
        <div class="dl">${b.label || 'Definition'}</div>
        <div class="dt">"${b.text}"</div>
        ${b.src ? `<div class="ds">📖 ${b.src}</div>` : ''}
      </div>`;

    case 'concept':
      return `<div class="concept-box">
        <div class="cl">🧠 CONCEPT BUILD — ${b.head}</div>
        ${b.body ? `<p>${b.body}</p>` : ''}
        ${b.items ? `<ul>${b.items.map(i=>`<li>${i}</li>`).join('')}</ul>` : ''}
        ${b.eq ? `<div class="eq-block">${b.eq}</div>` : ''}
        ${b.note ? `<p style="margin-top:8px;">${b.note}</p>` : ''}
      </div>`;

    case 'info':
      return `<div class="info-box">
        <div class="il">📌 ${b.head || 'Info'}</div>
        ${b.body ? `<p>${b.body}</p>` : ''}
        ${b.items ? `<ul>${b.items.map(i=>`<li>${i}</li>`).join('')}</ul>` : ''}
      </div>`;

    case 'tip':
      return `<div class="tip-box">
        <div class="tl">⚡ Exam Tip — BISE Bahawalpur</div>
        <p>${b.t}</p>
      </div>`;

    case 'error':
      return `<div class="error-box">
        <div class="el">⚠️ ${b.head || 'BOOK ERROR DETECTED'}</div>
        <div class="ew">❌ ${b.wrong}</div>
        <div class="ec">✅ ${b.correct}</div>
        <div class="er">📌 ${b.reason}</div>
      </div>`;

    case 'eq':
      return `<div class="eq-block">${b.t}</div>`;

    case 'table':
      let thtml = `<div class="table-wrap"><table>
        <tr>${b.cols.map(c=>`<th>${c}</th>`).join('')}</tr>
        ${b.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
      </table></div>`;
      return thtml;

    case 'ul':
      return `<ul>${b.items.map(i=>`<li>${i}</li>`).join('')}</ul>`;

    case 'ol':
      return `<ol>${b.items.map(i=>`<li>${i}</li>`).join('')}</ol>`;

    case 'factors':
      return `<ul class="factor-list">${b.items.map((f,i)=>`
        <li><span class="fn">${f.num||i+1}</span><strong>${f.title}</strong>${f.body}</li>`).join('')}
      </ul>`;

    case 'trends':
      return `<div class="trend-grid">${b.cards.map(c=>`
        <div class="trend-card">
          <div class="tc-p">${c.prop}</div>
          ${c.across ? `<div class="tc-a">→ ${c.across}</div>` : ''}
          ${c.across_note ? `<div style="font-size:11px;color:var(--text2);margin:3px 0;">${c.across_note}</div>` : ''}
          ${c.down ? `<div class="tc-d">↓ ${c.down}</div>` : ''}
          ${c.down_note ? `<div style="font-size:11px;color:var(--text2);margin-top:3px;">${c.down_note}</div>` : ''}
          ${c.body ? `<div style="font-size:12.5px;color:var(--text3);line-height:1.7;margin-top:6px;">${c.body}</div>` : ''}
        </div>`).join('')}
      </div>`;

    case 'reactions':
      return `<div class="rxn-box">
        <div class="rh">${b.head}</div>
        ${b.rxns.map(r=>`<div class="rxn">${r.eq}${r.note?`<span class="rn">← ${r.note}</span>`:''}</div>`).join('')}
      </div>`;

    case 'orbitals':
      return `<div class="orbital-grid">${b.items.map(o=>`
        <div class="orb-card">
          <div class="os">${o.sym}</div>
          <div class="osh">${o.shape}</div>
          <p>${o.body}</p>
        </div>`).join('')}
      </div>`;

    case 'qn-grid':
      return `<div class="qn-grid">${b.items.map(q=>`
        <div class="qn-card">
          <div class="qn">${q.name}</div>
          <div class="qs">${q.sym}</div>
          <p>${q.body}</p>
          <div class="qv">${q.vals}</div>
          ${q.note?`<p style="font-size:11.5px;margin-top:5px;">${q.note}</p>`:''}
        </div>`).join('')}
      </div>`;

    default:
      return '';
  }
}

// ─── MCQ RENDERER ─────────────────────────────────────────
function renderMCQ(q, i) {
  const letters = ['A','B','C','D'];
  return `<div class="mcq-item">
    <div class="mcq-q"><span class="qn">${q.num||'Q'+(i+1)}</span>${q.src?`(${q.src}) `:''} ${q.q}</div>
    <div class="mcq-opts">
      ${q.opts.map((o,j)=>`<div class="opt ${j===q.ans?'correct':''}">
        <span class="ol">${letters[j]}.</span>${o}
      </div>`).join('')}
    </div>
    ${q.exp ? `<div class="mcq-exp"><strong>Answer: ${letters[q.ans]}</strong> — ${q.exp}</div>` : ''}
  </div>`;
}

// ─── SHORT Q RENDERER ─────────────────────────────────────
function renderSQ(q, i) {
  return `<div class="sq-item">
    <div class="sq-q" onclick="toggleSQ(this)">
      <span class="sq-qnum">${q.num||'Q'+(i+1)}</span>
      ${q.q}
      <span class="sq-tog">▾</span>
    </div>
    <div class="sq-ans">
      <div class="btag">${q.tag||'BOARD STYLE ANSWER'}</div>
      ${q.a}
    </div>
  </div>`;
}

// ─── LONG Q RENDERER ──────────────────────────────────────
function renderLQ(q) {
  return `<div class="lq-item">
    <div class="lq-title">${q.title||''} ${q.marks?`<span class="marks-badge">${q.marks}</span>`:''}</div>
    <div class="lq-q">${q.q}</div>
    ${(q.parts||[]).map(p=>`
      <div class="lq-part-label">${p.label}</div>
      <ul class="lq-pts">${p.points.map(pt=>`<li>${pt}</li>`).join('')}</ul>
    `).join('')}
  </div>`;
}

// ─── INTERACTIVITY ────────────────────────────────────────
function setupInteractivity() {
  // scroll-to-top
  window.removeEventListener('scroll', scrollHandler);
  window.addEventListener('scroll', scrollHandler);
}
function scrollHandler() {
  const btn = document.getElementById('scroll-top');
  btn.classList.toggle('show', window.scrollY > 400);
}
function toggleSQ(el) {
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('show');
}
