import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NimiEmbedding } from './llm.ts';

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
  assert.equal((await embedding.embedText(texts)).length, 20);
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
    embedding.embedText(Array(17).fill('document')),
    /embedding model changed/,
  );
  assert.equal(calls, 2);
});
