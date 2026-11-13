import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {markdownExportText} from './export-text.ts';
globalThis.DOMParser=new JSDOM('').window.DOMParser;
test('PDF text removes formatting syntax while retaining literal code and citation numbers',()=>{
  const text=markdownExportText('**Project:** BLUEBIRD-1114 [1]\n\n`a ** b` and [Python docs](https://docs.python.org/).\n\n```python\np = "C:\\\\Temp"\n```');
  assert.match(text,/Project: BLUEBIRD-1114 \[1\]/);
  assert.match(text,/a \*\* b and Python docs/);
  assert.ok(text.includes('C:\\\\Temp'));
  assert.ok(!text.includes('**Project:**'));
});
