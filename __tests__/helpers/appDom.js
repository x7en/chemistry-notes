const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
const scriptPath = path.join(__dirname, '..', '..', 'app-inline.js');
const fileScript = fs.readFileSync(scriptPath, 'utf8').trim();

if (!scriptMatch) {
  throw new Error('Unable to locate inline script in index.html');
}

const extractedScript = scriptMatch[1].replace(/\/\/ ─── RUN[\s\S]*?init\(\);\s*$/, '').trim();

if (fileScript !== extractedScript) {
  throw new Error('app-inline.js is out of sync with index.html inline script');
}

const scriptWithoutRun = fileScript;

const baseMarkup = `
  <div id="sidebar" class="sidebar"></div>
  <div id="overlay" class="overlay"></div>
  <div id="ch-list"></div>
  <div id="page"></div>
  <div id="topbar-title"></div>
  <button id="scroll-top"></button>
`;

function createAppDom() {
  const dom = new JSDOM(baseMarkup, { url: 'http://localhost/#home', runScripts: 'outside-only' });
  dom.window.scrollTo = jest.fn();
  dom.window.fetch = jest.fn();
  const context = dom.getInternalVMContext();
  const script = new vm.Script(scriptWithoutRun, { filename: scriptPath });
  script.runInContext(context);
  return dom;
}

function setManifest(dom, data) {
  dom.window.eval(`manifest = ${JSON.stringify(data)};`);
}

module.exports = {
  createAppDom,
  setManifest
};
