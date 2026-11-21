const { createAppDom, setManifest } = require('./helpers/appDom');

const sampleManifest = [
  { id: 'ch01', num: '01', short_title: 'Periodic Table', title: 'Periodic Table', hot: true, deleted: false, status: 'ready', exam_line: 'line a' },
  { id: 'ch02', num: '02', short_title: 'Atomic Structure', title: 'Atomic Structure', hot: false, deleted: false, status: 'ready', exam_line: 'line b' },
  { id: 'ch03', num: '03', short_title: 'Coming Soon', title: 'Coming Soon', hot: false, deleted: false, status: 'coming', exam_line: 'line c' },
  { id: 'ch15', num: '15', short_title: 'Deleted', title: 'Deleted', hot: false, deleted: true, status: 'deleted', exam_line: 'removed' }
];

const chapterPayload = {
  meta: {
    id: 'ch02',
    number: 2,
    title: 'Atomic Structure',
    exam_info: 'Test exam line',
    deleted: 'Old portion removed',
    notes_merged: 'Merged with supplementary notes'
  },
  sections: [
    {
      number: '1.0',
      title: 'Overview',
      blocks: [
        { type: 'p', t: 'Paragraph text' },
        { type: 'subsec', t: 'Sub section' },
        { type: 'note', t: 'Note content' },
        { type: 'deleted', t: 'Deleted content' },
        { type: 'def', label: 'Definition', text: 'A definition', src: 'p.1' },
        { type: 'concept', head: 'Concept', body: 'Body', items: ['a', 'b'], eq: 'E=mc^2', note: 'remember' },
        { type: 'info', head: 'Info', body: 'Info body', items: ['x'] },
        { type: 'tip', t: 'Tip body' },
        { type: 'error', head: 'Error head', wrong: 'wrong', correct: 'right', reason: 'because' },
        { type: 'eq', t: 'a=b' },
        { type: 'table', cols: ['c1', 'c2'], rows: [['r1', 'r2']] },
        { type: 'ul', items: ['i1', 'i2'] },
        { type: 'ol', items: ['o1', 'o2'] },
        { type: 'factors', items: [{ num: 1, title: 'T1', body: 'B1' }] },
        { type: 'trends', cards: [{ prop: 'prop', across: 'across', down: 'down', body: 'body' }] },
        { type: 'reactions', head: 'Rxn', rxns: [{ eq: 'A->B', note: 'note' }] },
        { type: 'orbitals', items: [{ sym: 's', shape: 'sphere', body: 'body' }] },
        { type: 'qn-grid', items: [{ name: 'n', sym: 'n', body: 'body', vals: '1-7', note: 'note' }] }
      ]
    }
  ],
  mcqs: [
    { num: 'Q1', q: 'What?', opts: ['A', 'B', 'C', 'D'], ans: 1, exp: 'Because' }
  ],
  sqs: [
    { num: 'SAQ a', q: 'Explain?', a: '<p>Answer</p>', tag: 'BOARD STYLE ANSWER' }
  ],
  lqs: [
    { title: 'Long Q', marks: '4', q: 'Explain fully', parts: [{ label: 'Part 1', points: ['Point'] }] }
  ]
};

describe('sidebar and home rendering', () => {
  test('renderSidebar builds retained and deleted lists', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);

    dom.window.renderSidebar();
    const nav = dom.window.document.getElementById('ch-list');

    expect(nav.querySelectorAll('.ch-item').length).toBe(4);
    expect(nav.querySelectorAll('.ch-item.hot').length).toBe(1);
    expect(nav.textContent).toContain('Retained Chapters');
    expect(nav.textContent).toContain('Deleted (Ch 15)');
  });

  test('renderHome shows ready and coming chapters and resets title', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);

    dom.window.renderHome();
    const cards = dom.window.document.querySelectorAll('.ch-card');

    expect(cards.length).toBe(3);
    expect(dom.window.document.querySelector('.ch-card.is-coming')).not.toBeNull();
    expect(dom.window.document.title).toContain('FSc Chemistry XI');
    expect(dom.window.document.getElementById('topbar-title').textContent).toBe('Home');
  });
});

describe('routing', () => {
  test('router falls back to home when hash is missing', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);
    const homeSpy = jest.spyOn(dom.window, 'renderHome');
    dom.window.location.hash = '';

    dom.window.router();

    expect(homeSpy).toHaveBeenCalled();
  });

  test('router loads chapter by id from manifest', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);
    const loadSpy = jest.spyOn(dom.window, 'loadChapter').mockResolvedValue();
    dom.window.location.hash = '#ch02';

    dom.window.router();

    expect(loadSpy).toHaveBeenCalledWith(sampleManifest[1]);
  });

  test('updateActiveNav marks matching link', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);
    dom.window.renderSidebar();

    dom.window.updateActiveNav('ch01');

    expect(dom.window.document.querySelector('.ch-item.active')).not.toBeNull();
  });
});

describe('chapter loading', () => {
  test('shows coming soon message without fetching', async () => {
    const dom = createAppDom();
    const coming = { id: 'ch09', num: '09', status: 'coming' };

    await dom.window.loadChapter(coming);

    expect(dom.window.fetch).not.toHaveBeenCalled();
    expect(dom.window.document.getElementById('page').textContent).toContain('Coming soon');
  });

  test('renders chapter content when fetch succeeds', async () => {
    const dom = createAppDom();
    const chMeta = { id: 'ch02', num: '02', status: 'ready' };
    dom.window.fetch.mockResolvedValue({
      ok: true,
      json: async () => chapterPayload
    });
    const interactivitySpy = jest.spyOn(dom.window, 'setupInteractivity');

    await dom.window.loadChapter(chMeta);

    expect(dom.window.fetch.mock.calls[0][0]).toBe('chapters/ch02.json');
    expect(dom.window.document.title).toContain('Ch 02 · Atomic Structure');
    expect(dom.window.document.getElementById('page').innerHTML).toContain('ch-header');
    expect(interactivitySpy).toHaveBeenCalled();
  });

  test('shows error page when fetch fails', async () => {
    const dom = createAppDom();
    const chMeta = { id: 'ch02', num: '02', status: 'ready' };
    dom.window.fetch.mockResolvedValue({ ok: false });

    await dom.window.loadChapter(chMeta);

    expect(dom.window.document.getElementById('page').textContent).toContain('not available');
  });
});

describe('renderers', () => {
  test('renderBlock supports all known block types', () => {
    const dom = createAppDom();
    const { renderBlock } = dom.window;
    const outputs = chapterPayload.sections[0].blocks.map(renderBlock);

    outputs.forEach(out => expect(out).toBeTruthy());
    expect(renderBlock({ type: 'unknown' })).toBe('');
  });

  test('renderMCQ marks correct answer and explanation', () => {
    const dom = createAppDom();
    const mcqHtml = dom.window.renderMCQ(chapterPayload.mcqs[0], 0);

    expect(mcqHtml).toContain('class="opt correct"');
    expect(mcqHtml).toContain('Answer: B');
  });

  test('renderSQ builds togglable short questions', () => {
    const dom = createAppDom();
    const sqHtml = dom.window.renderSQ(chapterPayload.sqs[0], 0);

    expect(sqHtml).toContain('sq-item');
    expect(sqHtml).toContain('chev');
  });

  test('renderLQ displays parts and marks', () => {
    const dom = createAppDom();
    const lqHtml = dom.window.renderLQ(chapterPayload.lqs[0]);

    expect(lqHtml).toContain('marks-badge');
    expect(lqHtml).toContain('Part 1');
  });

  test('renderChapter stitches sections and questions', () => {
    const dom = createAppDom();
    const html = dom.window.renderChapter(chapterPayload);

    expect(html).toContain('ch-header');
    expect(html).toContain(chapterPayload.meta.deleted);
    expect(html).toContain(chapterPayload.meta.notes_merged);
    expect(html).toContain('group-title');
    expect(html).toContain('MCQs');
    expect(html).toContain('Short questions');
    expect(html).toContain('Long questions');
  });
});

describe('interactivity', () => {
  test('scroll handler toggles scroll-to-top button', () => {
    const dom = createAppDom();
    dom.window.bindChrome();
    const btn = dom.window.document.getElementById('scroll-top');

    dom.window.scrollY = 500;
    dom.window.dispatchEvent(new dom.window.Event('scroll'));
    expect(btn.classList.contains('show')).toBe(true);

    dom.window.scrollY = 0;
    dom.window.dispatchEvent(new dom.window.Event('scroll'));
    expect(btn.classList.contains('show')).toBe(false);
  });

  test('toggleSQ expands and collapses answers', () => {
    const dom = createAppDom();
    const question = dom.window.document.createElement('div');
    const answer = dom.window.document.createElement('div');
    answer.className = 'sq-ans';
    dom.window.document.body.append(question, answer);

    dom.window.toggleSQ(question);
    expect(question.classList.contains('open')).toBe(true);
    expect(answer.classList.contains('show')).toBe(true);
  });
});


describe('regressions', () => {
  const fs = require('fs');
  const path = require('path');

  test('diagram blocks render a semantic figure and escape attributes', () => {
    const dom = createAppDom();
    const html = dom.window.renderBlock({
      type: 'diagram',
      file: 'assets/diagrams/ch03/ch03_sigma_vs_pi.svg',
      alt: 'A "sigma" bond < head-on overlap',
      caption: 'Sigma vs pi: [A] < [B]',
      number: '3.4'
    });

    expect(html).toContain('<figure class="figure"');
    expect(html).toContain('<figcaption>');
    expect(html).toContain('Fig. 3.4');
    // No inline handler may smuggle the caption into an attribute.
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('&quot;sigma&quot; bond < ');
    expect(html).toContain('&quot;sigma&quot; bond &lt; head-on overlap');
  });

  test('renderSection omits the id attribute when a section has none', () => {
    const dom = createAppDom();
    const withId = dom.window.renderSection({ number: '1.0', title: 'A', id: 'sec1', blocks: [] });
    const withoutId = dom.window.renderSection({ number: '1.1', title: 'B', blocks: [] });

    expect(withId).toContain('id="s-sec1"');
    expect(withoutId).not.toContain('id=""');
  });

  test('renderSidebar derives the deleted range and footer counts', () => {
    const dom = createAppDom();
    setManifest(dom, [
      ...sampleManifest,
      { id: 'ch16', num: '16', short_title: 'Lab Safety', title: 'Lab Safety', hot: false, deleted: true, status: 'deleted', exam_line: 'removed' }
    ]);
    dom.window.renderSidebar();

    expect(dom.window.document.getElementById('ch-list').textContent).toContain('Deleted (Ch 15–16)');
    const footer = dom.window.document.getElementById('sidebar-footer').textContent;
    expect(footer).toContain('3 retained');
    expect(footer).toContain('2 available');
    expect(footer).toContain('2 deleted');
  });

  test('initQuiz resets a stale score bar', () => {
    const dom = createAppDom();
    const doc = dom.window.document;
    doc.getElementById('page').innerHTML = '<div id="qscore">Score: 9 / 9</div><div id="qcard"></div>';
    dom.window.eval(`currentChapter = { quiz: [
      { q: 'a', opts: ['1','2','3','4'], ans: 0, exp: '' },
      { q: 'b', opts: ['1','2','3','4'], ans: 1, exp: '' }
    ] };`);

    dom.window.initQuiz();

    expect(doc.getElementById('qscore').textContent).toBe('Score: 0 / 2');
  });

  test('chapter data goes through the figure path convention', () => {
    const dir = path.join(__dirname, '..', 'chapters');
    const files = fs.readdirSync(dir).filter(f => /^ch\d{2}\.json$/.test(f));

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      expect(data.saqs).toBeUndefined();
      expect(Array.isArray(data.sqs)).toBe(true);

      for (const section of data.sections || []) {
        for (const block of section.blocks || []) {
          if (block.type !== 'diagram') continue;
          expect(block.file).toMatch(/^assets\/diagrams\/ch\d{2}\/ch\d{2}_[a-z0-9][a-z0-9_-]*\.svg$/);
          expect(block.alt).toBeTruthy();
        }
      }
    }
  });
});


describe('bug fixes', () => {
  test('deleted chapters reached by hash do not fetch or show a 404', async () => {
    const dom = createAppDom();
    const deleted = { id: 'ch15', num: '15', title: 'Separation Techniques', short_title: 'Separation', status: 'deleted', deleted: true };

    await dom.window.loadChapter(deleted);

    expect(dom.window.fetch).not.toHaveBeenCalled();
    expect(dom.window.document.getElementById('page').textContent).toContain('Deleted from the syllabus');
  });

  test('a superseded chapter response never overwrites the current one', async () => {
    const dom = createAppDom();
    let resolveSlow;
    const slow = new Promise(resolve => { resolveSlow = resolve; });
    const payload = (title, number) => ({ meta: { title, number }, sections: [], mcqs: [], sqs: [], lqs: [] });

    dom.window.fetch
      .mockReturnValueOnce(slow)
      .mockResolvedValueOnce({ ok: true, json: async () => payload('Second', 2) });

    const first = dom.window.loadChapter({ id: 'ch01', num: '01', status: 'ready' });
    const second = dom.window.loadChapter({ id: 'ch02', num: '02', status: 'ready' });
    await second;

    resolveSlow({ ok: true, json: async () => payload('First', 1) });
    await first;

    expect(dom.window.document.title).toContain('Ch 02 · Second');
  });

  test('short questions open with the keyboard and report aria-expanded', () => {
    const dom = createAppDom();
    const doc = dom.window.document;
    doc.getElementById('page').innerHTML = dom.window.renderSQ({ num: 'a', q: 'Why?', a: '<p>Because</p>' }, 0);
    dom.window.bindChrome();

    const head = doc.querySelector('.sq-q');
    const answer = doc.querySelector('.sq-ans');
    expect(head.getAttribute('aria-expanded')).toBe('false');

    head.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(answer.classList.contains('show')).toBe(true);
    expect(head.getAttribute('aria-expanded')).toBe('true');
  });

  test('home view does not mark deleted sidebar entries as active', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);
    dom.window.renderSidebar();

    dom.window.updateActiveNav('');

    expect(dom.window.document.querySelector('.ch-item.active')).toBeNull();
  });
});


describe('security', () => {
  test('sanitizer strips scripts, handlers, styles and ids', () => {
    const dom = createAppDom();
    const dirty = '<p id="page" style="position:fixed" onclick="alert(1)">Keep me' +
      '<script>alert(2)</scr' + 'ipt><img src=x onerror="alert(3)"></p>';
    const clean = dom.window.sanitizeHtml(dirty);

    expect(clean).toContain('Keep me');
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/onclick|onerror/i);
    expect(clean).not.toContain('style=');
    expect(clean).not.toContain('id=');
    expect(clean).not.toContain('<img');
  });

  test('chapter load sanitizes every HTML-bearing field', async () => {
    const dom = createAppDom();
    const payload = {
      meta: { title: 'T', number: 1 },
      sections: [{ number: '1.0', title: 'S', blocks: [{ type: 'p', t: '<em>ok</em><img src=x onerror=alert(1)>' }] }],
      mcqs: [], sqs: [], lqs: []
    };
    dom.window.fetch.mockResolvedValue({ ok: true, json: async () => payload });

    await dom.window.loadChapter({ id: 'ch01', num: '01', status: 'ready' });

    const page = dom.window.document.getElementById('page');
    expect(page.innerHTML).toContain('<em>ok</em>');
    expect(page.innerHTML).not.toMatch(/onerror|<img/i);
  });

  test('theme switcher sets the accent and persists aria state', () => {
    const dom = createAppDom();
    const doc = dom.window.document;
    dom.window.bindChrome();

    dom.window.setAccent('forest');

    expect(doc.documentElement.getAttribute('data-accent')).toBe('forest');
    const forest = doc.querySelector('[data-accent-set="forest"]');
    const burgundy = doc.querySelector('[data-accent-set="burgundy"]');
    expect(forest.getAttribute('aria-pressed')).toBe('true');
    expect(burgundy.getAttribute('aria-pressed')).toBe('false');
  });
});
