import assert from 'node:assert/strict';
import test from 'node:test';
import { compiler } from 'markdown-to-jsx/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { createCitationRenderRule } from './citations.tsx';

const sources = [
  { metadata: { url: 'https://docs.python.org/3/library/pathlib.html' } },
  { metadata: { url: 'file_id://owned-document' } },
];
function render(text, selectedSources = sources) {
  return new JSDOM(
    renderToStaticMarkup(
      compiler(text, {
        renderRule: createCitationRenderRule(selectedSources, () => {}),
      }),
    ),
  ).window.document.body;
}

test('a Windows backslash code span leaves following text and citations intact', () => {
  const body = render(
    '反斜杠 `\\`、盘符、UNC 路径等[1]。即使 `PureWindowsPath` [2]。',
  );
  assert.deepEqual(
    [...body.querySelectorAll('code')].map((node) => node.textContent),
    ['\\', 'PureWindowsPath'],
  );
  assert.equal(body.querySelectorAll('a').length, 2);
  assert.equal(body.querySelector('a').href, sources[0].metadata.url);
  assert.ok(!body.textContent.includes('<citation'));
  assert.ok(body.textContent.includes('、盘符、UNC 路径等'));
});

test('numeric brackets remain literal in inline and fenced code', () => {
  const body = render(
    '`values[1]`\n\n```python\nvalues[1]\n```\n\nEvidence [1, 2].',
  );
  assert.deepEqual(
    [...body.querySelectorAll('code')].map((node) => node.textContent.trim()),
    ['values[1]', 'values[1]'],
  );
  assert.equal(body.querySelectorAll('a').length, 2);
  assert.ok(!body.querySelector('code a'));
});

test('normal and reference-style links retain their labels and destinations', () => {
  const body = render(
    '[label [1]](https://example.com) [reference [2]][ref]\n\n[ref]: https://example.org',
  );
  assert.deepEqual(
    [...body.querySelectorAll('a')].map((node) => [
      node.textContent,
      node.href,
    ]),
    [
      ['label [1]', 'https://example.com/'],
      ['reference [2]', 'https://example.org/'],
    ],
  );
});

test('raw anchors and code containers do not gain nested citation links', () => {
  const body = render(
    '<a href="https://example.com">label [1]</a>\n\n<code>values[1]</code>\n\n<pre>values[2]</pre>',
  );
  assert.equal(body.querySelectorAll('a').length, 1);
  assert.equal(body.querySelector('a').textContent, 'label [1]');
  assert.equal(body.querySelector('code').textContent, 'values[1]');
  assert.equal(body.querySelector('pre').textContent, 'values[2]');
});

test('missing references and non-numeric brackets retain their original text', () => {
  const body = render('[0] [99] [1st example] [1, 99]');
  assert.ok(body.textContent.includes('[0] [99] [1st example]'));
  assert.ok(body.textContent.includes('[99]'));
  assert.equal(body.querySelectorAll('a').length, 1);
  assert.equal(render('values[1]', []).textContent, 'values[1]');
});

test('citation URLs are React values rather than interpolated HTML', () => {
  const url = 'https://example.com/?q="quoted"&next=<citation>';
  const body = render('Evidence [1].', [{ metadata: { url } }]);
  assert.equal(body.querySelector('a').getAttribute('href'), url);
  assert.equal(body.querySelectorAll('citation').length, 0);
  assert.equal(body.querySelector('a').textContent, '1');
});
