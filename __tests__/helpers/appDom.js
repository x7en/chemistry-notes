const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appScript = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');

// Tests mount the real shell markup and execute the real app bundle, so the
// suite can never drift from what the browser runs.
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
if (!bodyMatch) throw new Error('Unable to locate <body> in index.html');

const baseMarkup = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/g, '');

function createAppDom() {
  const dom = new JSDOM(
    `<!doctype html><html lang="en" data-accent="burgundy" data-mode="light"><head></head><body>${baseMarkup}</body></html>`,
    { url: 'http://localhost/#home', runScripts: 'outside-only', pretendToBeVisual: true }
  );

  dom.window.__CHEM_TEST__ = true;
  dom.window.scrollTo = jest.fn();
  dom.window.fetch = jest.fn();

  const context = dom.getInternalVMContext();
  new vm.Script(appScript, { filename: 'assets/js/app.js' }).runInContext(context);
  return dom;
}

function setManifest(dom, data) {
  dom.window.eval(`manifest = ${JSON.stringify(data)};`);
}

module.exports = { createAppDom, setManifest };
