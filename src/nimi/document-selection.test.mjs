import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement as h, act } from 'react';
import {
  DocumentSelectionProvider,
  useDocumentSelection,
} from './document-selection.tsx';

async function harness(t) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://localhost/' });
  const original = {
    window: globalThis.window,
    document: globalThis.document,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const { createRoot } = await import('react-dom/client');
  const container = dom.window.document.getElementById('root'),
    root = createRoot(container);
  const identity = new AbortController();
  function View({ scope }) {
    const picker = useDocumentSelection();
    return h(
      'section',
      null,
      h(
        'button',
        {
          onClick: () =>
            picker.choose({
              route: '/',
              scope,
              workspace: 'same-pc',
              attached: [],
              sources: [],
              mode: 'speed',
            }),
        },
        'Select',
      ),
      h('output', null, picker.selected.map((file) => file.name).join(',')),
    );
  }
  async function render(scope, key = 'identity-a') {
    await act(async () =>
      root.render(
        h(
          DocumentSelectionProvider,
          { key, signal: identity.signal },
          scope ? h(View, { key: scope, scope }) : null,
        ),
      ),
    );
  }
  async function choose() {
    await act(async () => container.querySelector('button').click());
  }
  async function select(input, name) {
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new dom.window.File(['sample'], name, { type: 'text/plain' })],
    });
    await act(async () =>
      input.dispatchEvent(new dom.window.Event('change', { bubbles: true })),
    );
  }
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, original);
  });
  return { container, identity, render, choose, select };
}

test('a real file input remains mounted while only the Runtime view retires', async (t) => {
  const h = await harness(t);
  await h.render('scope-a');
  const input = h.container.querySelector('input');
  input.click = () => {};
  await h.choose();
  await h.render(null);
  assert.equal(input.isConnected, true);
  assert.equal(h.container.querySelector('input'), input);
  await h.select(input, 'android-note.txt');
  await h.render('scope-b');
  assert.equal(
    h.container.querySelector('output').textContent,
    'android-note.txt',
  );
  assert.equal(h.container.querySelector('input'), input);
});

test('identity invalidation clears a selected file and rejects a late picker callback', async (t) => {
  const h = await harness(t);
  await h.render('scope-a');
  const input = h.container.querySelector('input');
  input.click = () => {};
  await h.choose();
  await h.select(input, 'private-draft.txt');
  assert.equal(
    h.container.querySelector('output').textContent,
    'private-draft.txt',
  );
  await act(async () => h.identity.abort());
  assert.equal(h.container.querySelector('output').textContent, '');
  await h.select(input, 'late-draft.txt');
  assert.equal(h.container.querySelector('output').textContent, '');
  await h.render('scope-new', 'identity-new');
  assert.notEqual(h.container.querySelector('input'), input);
  assert.equal(h.container.querySelector('output').textContent, '');
});
