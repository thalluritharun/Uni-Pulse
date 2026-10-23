/* Source-first learning: original words, useful reading controls, offline access. */
(function () {
  'use strict';
  const records = window.UNI_PULSE_SOURCE_RECORDS || [];
  records.forEach(record => {
    record.sections = record.topics;
    record.topics.forEach(topic => { if (topic.pages) topic.text = topic.pages.map(page => page.text).join(''); });
    record.sourceText = record.topics.map(topic => topic.text).join('');
  });
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const find = (subjectId, topicId) => {
    const record = records.find(item => item.subjectId === subjectId);
    return {record, topic: record?.topics.find(item => item.id === topicId)};
  };
  const paragraphs = text => text.match(/[^\r\n]+(?:\r?\n(?!\r?\n)[^\r\n]+)*(?:\r?\n)*(?:\f)?|[\s\S]/g) || [];
  function copyHTML(text, esc) {
    // Whitespace and original wording remain in each source block, including tables.
    return paragraphs(text).map(part => {
      const trimmed = part.trim();
      let style = 'source-paragraph';
      if (/^<PARSED TEXT FOR PAGE:/.test(trimmed)) style += ' source-page-marker';
      else if (/^\d+\.\d+\s/.test(trimmed)) style += ' source-subheading';
      else if (/^(Example|Practice example|Programming example|Task \d|Scenario:)/i.test(trimmed)) style += ' source-example';
      else if (/^(Important rule:|Key idea:|Takeaway)/.test(trimmed)) style += ' source-takeaway';
      if (/ {5,}\S/.test(part) && !/^\s*<PARSED/.test(trimmed)) style += ' source-table';
      return `<div class="${style}" data-source-copy>${esc(part)}</div>`;
    }).join('');
  }
  function sourceBlocks(topic) {
    // Segmentation retains every source character, including all practice material.
    const matches = [...topic.text.matchAll(/^(?:\d+\.\d+ [^\r\n]+|[ \t]*Part [A-D] [–-] [^\r\n]+)\r?$/gm)];
    const offsets = [0, ...matches.map(match => match.index).filter(index => index > 0)];
    return offsets.map((start, index) => {
      const text = topic.text.slice(start, offsets[index + 1] ?? topic.text.length);
      const first = text.trim().split(/\r?\n/)[0];
      const title = /^<PARSED/.test(first) || /^UNIT/.test(first) ? 'Unit introduction' : first;
      return {text, title, supplement: /^Part [A-D]/.test(first)};
    });
  }
  function install(data) {
    records.forEach(record => {
      const subject = data.subjects.find(item => item.id === record.subjectId);
      if (!subject) return;
      subject.sourceUrl = record.sourceUrl;
      if (record.subjectId === 'pea103') {
        subject.units = [{id:'ai-u1', title:record.title, available:true, readingOnly:true, questions:[],
          topics:record.topics.map(topic => ({id:topic.id, title:topic.title, minutes:Math.max(4, Math.ceil(topic.text.split(/\s+/).length / 170)), sections:[], sourceUrl:record.sourceUrl}))}];
      } else {
        const unit = subject.units.find(item => item.id === 'u1');
        if (unit) unit.topics.forEach(topic => {
          const original = record.topics.find(item => item.id === topic.id);
          if (!original) return;
          topic.sections = []; // Never fall back to the old shortened lessons.
          delete topic.example;
          delete topic.task;
          topic.minutes = Math.max(4, Math.ceil(original.text.split(/\s+/).length / 170));
          topic.sourceUrl = record.sourceUrl;
        });
      }
    });
    bindControls();
  }
  function topicHTML(subjectId, topicId, esc = escapeHTML) {
    const {record, topic} = find(subjectId, topicId);
    if (!topic) return '';
    const isPDF = record.sourceFormat === 'pdf';
    const count = isPDF ? `${topic.pages.length} original pages` : 'Complete original wording';
    let body;
    if (isPDF) {
      body = topic.pages.map(page => `<figure class="source-slide" id="source-page-${page.number}">
        <div class="source-slide-top"><span>ORIGINAL PAGE ${String(page.number).padStart(2,'0')}</span><a href="${esc(record.sourceUrl)}#page=${page.number}" target="_blank" rel="noopener">Open full size ↗</a></div>
        <a class="source-slide-image" href="resources/pea103-pages/page-${String(page.number).padStart(2,'0')}.png" target="_blank" rel="noopener" aria-label="Enlarge original page ${page.number}"><img src="resources/pea103-pages/page-${String(page.number).padStart(2,'0')}.png" alt="Original course page ${page.number}; complete text is available below" width="1440" height="810" loading="lazy"></a>
        <details class="source-transcript"><summary>Read page ${page.number} text</summary><div class="source-page-text">${copyHTML(page.text,esc)}</div></details>
        </figure>`).join('');
    } else {
      body = sourceBlocks(topic).map((block,index) => block.supplement
        ? `<details class="source-section source-supplement" id="source-section-${index}"><summary>${esc(block.title)}</summary><div class="source-section-body">${copyHTML(block.text,esc)}</div></details>`
        : `<section class="source-section" id="source-section-${index}"><div class="source-section-body">${copyHTML(block.text,esc)}</div></section>`).join('');
    }
    return `<div class="learning-source" data-learning-source data-subject="${esc(subjectId)}" data-topic="${esc(topicId)}"><div class="source-banner"><div><span class="source-eyebrow">THE SOURCE COLLECTION</span><h2>${esc(record.title)}</h2><p>${esc(count)}</p></div><a class="source-download" href="${esc(record.sourceUrl)}" download>Download ${isPDF ? 'PDF' : 'source text'} ↓</a></div><p class="source-fidelity">${isPDF ? 'Explore the original pages, or expand their full text below. Every page, table and diagram is included.' : 'The full supplied source text, arranged for reading. Examples, questions and activities keep their original wording.'}</p><div class="source-body">${body}</div></div>`;
  }
  function companionHTML(subjectId, topicId, esc = escapeHTML) {
    const {record, topic} = find(subjectId, topicId);
    if (!topic) return '';
    const jumps = topic.pages ? topic.pages.map(page => ({id:`source-page-${page.number}`,label:`Page ${page.number}`}))
      : sourceBlocks(topic).map((block,index) => ({id:`source-section-${index}`,label:block.title}));
    return `<aside class="learning-companion"><div class="companion-heading"><span class="source-eyebrow">YOUR READING COMPANION</span><h3>A little more clarity.</h3><p>Find a concept, adjust your reading space, or jump straight to a section.</p></div>
      <form class="source-search-form" data-source-search><label for="source-search">Find in this lesson</label><div class="source-search-row"><input id="source-search" name="query" type="search" placeholder="Search a word or phrase" maxlength="120"><button type="submit" class="source-control">Find</button></div><output class="source-search-result" aria-live="polite"></output></form>
      <div class="source-reading-controls"><button type="button" class="source-control" data-learning-action="size" aria-pressed="false">Aa · Larger text</button><button type="button" class="source-control" data-learning-action="focus" aria-pressed="false">Reading spotlight</button><button type="button" class="source-control" data-learning-action="clear">Clear highlights</button></div>
      <nav class="source-jumps" aria-label="Jump within lesson">${jumps.map(jump => `<a href="#${esc(jump.id)}" data-learning-jump="${esc(jump.id)}">${esc(jump.label)}</a>`).join('')}</nav>
      <a class="companion-source-link" href="${esc(record.sourceUrl)}" download>Keep a copy for offline study ↓</a></aside>`;
  }
  let bound = false;
  function bindControls() {
    if (bound || typeof document === 'undefined') return;
    bound = true;
    document.addEventListener('click', event => {
      const control = event.target.closest('[data-learning-action]');
      const source = document.querySelector('[data-learning-source]');
      if (control && source) {
        const action = control.dataset.learningAction;
        if (action === 'size' || action === 'focus') {
          const enabled = source.classList.toggle(action === 'size' ? 'source-large' : 'source-spotlight');
          control.setAttribute('aria-pressed',String(enabled));
        } else if (action === 'clear') clearHighlights();
      }
      const jump = event.target.closest('[data-learning-jump]');
      if (jump) {
        event.preventDefault();
        const target = document.getElementById(jump.dataset.learningJump);
        if (!target) return;
        if (target.tagName === 'DETAILS') target.open = true;
        target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
        target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
      }
    });
    document.addEventListener('submit', event => {
      if (!event.target.matches('[data-source-search]')) return;
      event.preventDefault();
      const form = event.target;
      const query = new FormData(form).get('query').trim();
      clearHighlights();
      if (!query) { form.querySelector('output').textContent = 'Enter a word or phrase to find.'; return; }
      let count = 0;
      document.querySelectorAll('[data-learning-source] [data-source-copy]').forEach(element => {
        const text = element.textContent;
        const normalized = text.toLocaleLowerCase();
        const needle = query.toLocaleLowerCase();
        let cursor = 0;
        let match;
        const fragment = document.createDocumentFragment();
        while ((match = normalized.indexOf(needle,cursor)) !== -1) {
          fragment.append(document.createTextNode(text.slice(cursor,match)));
          const mark = document.createElement('mark');
          mark.textContent = text.slice(match,match+query.length);
          fragment.append(mark);
          cursor = match + query.length;
          count++;
        }
        if (cursor) {
          fragment.append(document.createTextNode(text.slice(cursor)));
          element.replaceChildren(fragment);
          const details = element.closest('details');
          if (details) details.open = true;
        }
      });
      form.querySelector('output').textContent = `${count} match${count === 1 ? '' : 'es'}${count ? ' highlighted in the original text.' : '. Try a different phrase.'}`;
      const first = document.querySelector('[data-learning-source] mark');
      if (first) first.scrollIntoView({block:'center',behavior:'instant'});
    });
  }
  function clearHighlights() {
    document.querySelectorAll('[data-learning-source] [data-source-copy]').forEach(element => {
      if (element.querySelector('mark')) element.textContent = element.textContent;
    });
    document.querySelectorAll('.source-search-result').forEach(output => { output.textContent = ''; });
  }
  window.UniPulseLearning = {records, install, hasSource:(subjectId,topicId) => Boolean(find(subjectId,topicId).topic),topicHTML,companionHTML};
})();
