/* Run with: node tests/learning.test.cjs. No third-party packages required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.createContext(context);
for (const file of ['data', 'learning-sources', 'learning-content']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', `${file}.js`), 'utf8'), context);
}
const api = context.window.UniPulseLearning;
api.install(context.window.CAMPUS_DATA);
const sourceFiles = {
  pea101: 'PSCT-Unit-1-source-text.txt',
  pea103: 'PEA103-AI-Interaction-Design-source-text.txt'
};
let pageCount = 0;
for (const record of api.records) {
  assert(sourceFiles[record.subjectId], `Register a source file for ${record.subjectId}`);
  const original = fs.readFileSync(path.join(root, 'resources', sourceFiles[record.subjectId]), 'utf8');
  assert.equal(record.sourceText, original, `${record.subjectId}: full source must be preserved`);
  assert.equal(record.sections.map(topic => topic.text).join(''), original);
  assert(fs.existsSync(path.join(root, record.sourceUrl)), `${record.subjectId}: source download must exist`);
  for (const topic of record.topics) {
    assert(api.hasSource(record.subjectId, topic.id));
    const html = api.topicHTML(record.subjectId, topic.id);
    assert(html.includes('source-banner'));
    assert(api.companionHTML(record.subjectId, topic.id).includes('data-source-search'));
    const texts = [...html.matchAll(/data-source-copy>([\s\S]*?)<\/div>/g)].map(match =>
      match[1].replace(/&(#39|quot|lt|gt|amp);/g, (_, entity) =>
        ({'#39':"'", quot:'"', lt:'<', gt:'>', amp:'&'}[entity])));
    assert.equal(texts.join(''), topic.text, `${record.subjectId}/${topic.id}: displayed text must preserve every character`);
    if (topic.pages) for (const page of topic.pages) {
      const asset = path.join(root, 'resources', 'pea103-pages', `page-${String(page.number).padStart(2, '0')}.png`);
      assert(fs.existsSync(asset), `Missing original page preview: ${asset}`);
      assert.equal(fs.readFileSync(asset).subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Invalid PNG preview: ${asset}`);
      pageCount++;
    }
  }
  console.log(`PASS ${record.subjectId}: all ${record.sourceText.length} source characters retained across ${record.topics.length} topics`);
}
const psctUnit = context.window.CAMPUS_DATA.subjects.find(subject => subject.id === 'pea101').units[0];
assert.equal(psctUnit.topics.map(topic => topic.id).join(','), 'framing,requirements,constraints,decomposition,abstraction,representation');
assert.equal(psctUnit.questions.length, 30, 'PEA 101 keeps its supplied question bank');
const aiUnit = context.window.CAMPUS_DATA.subjects.find(subject => subject.id === 'pea103').units[0];
assert(aiUnit.readingOnly, 'PEA 103 does not require a fabricated assessment');
assert.equal(aiUnit.questions.length, 0);
assert.equal(aiUnit.topics.length, 8);
assert.equal(pageCount, 50, 'Every original AI PDF page must have a preview');
console.log('PASS rendered HTML text, source downloads, 50 PNG page previews and unit configuration');
