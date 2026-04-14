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
    expect(nav.textContent).toContain('Deleted (Ch 15–16)');
  });

  test('renderHome shows ready and coming chapters and resets title', () => {
    const dom = createAppDom();
    setManifest(dom, sampleManifest);

    dom.window.renderHome();
    const cards = dom.window.document.querySelectorAll('.ch-card');

    expect(cards.length).toBe(3);
    expect(dom.window.document.querySelector('.ch-card.deleted')).not.toBeNull();
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
    expect(dom.window.document.getElementById('page').textContent).toContain('Coming Soon');
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

    expect(dom.window.fetch).toHaveBeenCalledWith('chapters/ch02.json');
    expect(dom.window.document.title).toContain('Ch 02 · Atomic Structure');
    expect(dom.window.document.getElementById('page').innerHTML).toContain('ch-header');
    expect(interactivitySpy).toHaveBeenCalled();
  });

  test('shows error page when fetch fails', async () => {
    const dom = createAppDom();
    const chMeta = { id: 'ch02', num: '02', status: 'ready' };
    dom.window.fetch.mockResolvedValue({ ok: false });

    await dom.window.loadChapter(chMeta);

    expect(dom.window.document.getElementById('page').textContent).toContain('not yet available');
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
    expect(sqHtml).toContain('sq-tog');
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
    expect(html).toContain('MCQs —');
    expect(html).toContain('Short Questions');
    expect(html).toContain('Long Questions');
  });
});

describe('interactivity', () => {
  test('scroll handler toggles scroll-to-top button', () => {
    const dom = createAppDom();
    dom.window.setupInteractivity();
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
