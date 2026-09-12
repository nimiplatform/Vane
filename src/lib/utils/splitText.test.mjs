import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTokenCount, splitText } from './splitText.ts';

test('an oversized paragraph is split without losing text or blocking progress', () => {
  const paragraph = 'A document paragraph without sentence breaks '.repeat(300);
  const chunks = splitText(paragraph, 128, 0);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.join(''), paragraph);
  assert.ok(chunks.every((chunk) => chunk.length > 0 && getTokenCount(chunk) <= 128));
});

test('Chinese document text keeps complete characters when a paragraph is split', () => {
  const paragraph = '文档检索需要保留完整的中文内容和字符边界'.repeat(100);
  const chunks = splitText(paragraph, 128, 0);
  assert.equal(chunks.join(''), paragraph);
  assert.ok(chunks.every((chunk) => !chunk.includes('\ufffd') && getTokenCount(chunk) <= 128));
});
