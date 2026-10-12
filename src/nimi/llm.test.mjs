import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NimiEmbedding, NimiLLM } from './llm.ts';
import { createVaneBusinessContext } from './context.ts';

test('the Vane streaming wrapper preserves opaque continuity for the next researcher step', async () => {
  const inputs = [];
  const carrier = { kind: 'test.encrypted', version: 1, payload: [0, 255] };
  const model = new NimiLLM({
    signal: new AbortController().signal,
    services: { ai: {
      text: { async streamTurn() { throw new Error('Vane research must use its selected sync mode'); } },
      scenario: { async execute(input, options) {
        inputs.push(input);
        assert.equal(options.signal, model.config.signal);
        return {
          output: { type: 'text-generate', finishReason: 'stop', items: [
            { type: 'reasoning-continuity', carrier },
            { type: 'text', text: 'Answer.' },
          ] },
          traceId: 'test-trace',
        };
      } },
    } },
  });
  let final;
  for await (const chunk of model.streamText({ messages: [{ role: 'user', content: 'Answer.' }] })) final = chunk;
  const items = final.additionalInfo.outputItems;
  assert.deepEqual(items[0], { type: 'reasoning-continuity', carrier: { ...carrier, payload: new Uint8Array(carrier.payload) } });
  await model.generateText({ messages: [
    { role: 'user', content: 'Answer.' },
    { role: 'assistant', content: 'Answer.', turnItems: items.map((output) => ({ type: 'output', output })) },
    { role: 'user', content: 'Continue.' },
  ] });
  assert.deepEqual(inputs[1].messages[1].turnItems[0], { type: 'output', output: { type: 'reasoning-continuity', carrier } });
});

test('a ready service rebind retires old callbacks without replaying their work', () => {
  const binding = createVaneBusinessContext();
  const firstServices = { label: 'first-ready-scope' };
  const nextServices = { label: 'next-ready-scope' };
  const firstView = binding.viewId;
  binding.bind(firstServices);
  const captured = binding.current();
  binding.invalidate();
  assert.equal(captured.signal.aborted, true);
  assert.throws(() => binding.current(), /Host is unavailable/);
  assert.notEqual(binding.viewId, firstView);
  binding.bind(nextServices);
  assert.equal(binding.current().services, nextServices);
  assert.equal(binding.current().signal.aborted, false);
  assert.equal(captured.services, firstServices);
  assert.throws(() => captured.signal.throwIfAborted(), /previous Vane work was canceled/);
  binding.close();
  assert.throws(() => binding.bind(firstServices), /Host is unavailable/);
});

test('embedding batches retain the Runtime space without reading unrelated AIConfig revisions', async () => {
  const batches = [];
  const embedding = new NimiEmbedding({
    signal: new AbortController().signal,
    services: {
      aiConfig: {
        get() {
          throw new Error('AIConfig revision cannot identify a vector space');
        },
      },
      ai: {
        scenario: {
          async execute(input) {
            assert.equal(input.purpose, 'retrieval-document');
            batches.push(input.inputs);
            return {
              output: {
                type: 'text-embed',
                vectors: input.inputs.map(() => [0.1, 0.2]),
                spaceId: 'space-a',
              },
              traceId: 'test-trace',
            };
          },
        },
      },
    },
  });
  const texts = Array.from({ length: 20 }, (_, index) => `document ${index}`);
  assert.equal((await embedding.embedText(texts, 'retrieval-document')).length, 20);
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [16, 4],
  );
  assert.equal(embedding.spaceId, 'space-a');
});

test('a model change between embedding batches rejects the entire result', async () => {
  let calls = 0;
  const embedding = new NimiEmbedding({
    signal: new AbortController().signal,
    services: {
      ai: {
        scenario: {
          async execute(input) {
            calls++;
            return {
              output: {
                type: 'text-embed',
                vectors: input.inputs.map(() => [0.1, 0.2]),
                spaceId: calls === 1 ? 'space-a' : 'space-b',
              },
              traceId: 'test-trace',
            };
          },
        },
      },
    },
  });
  await assert.rejects(
    embedding.embedText(Array(17).fill('document'), 'retrieval-document'),
    /embedding model changed/,
  );
  assert.equal(calls, 2);
});

test('stopping an embedding request aborts its active batch before another batch begins', async () => {
  const controller = new AbortController();
  let calls = 0;
  const embedding = new NimiEmbedding({
    signal: controller.signal,
    services: { ai: { scenario: { execute(_input, options) {
      calls++;
      assert.equal(options.signal, controller.signal);
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
    } } } },
  });
  const pending = embedding.embedText(Array(20).fill('document'), 'retrieval-query');
  controller.abort(new Error('Stopped the embedding request'));
  await assert.rejects(pending, /Stopped the embedding request/);
  assert.equal(calls, 1);
});
