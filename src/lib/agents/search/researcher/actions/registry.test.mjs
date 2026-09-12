import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import ActionRegistry from './registry.ts';

function registerAction(name, execute) {
  ActionRegistry.register({
    name,
    schema: z.object({}),
    getDescription: () => name,
    getToolDescription: () => name,
    enabled: () => true,
    execute,
  });
}

test('parallel results retain tool-call order when later calls finish first', async () => {
  const firstGate = Promise.withResolvers();
  const secondFinished = Promise.withResolvers();
  const completionOrder = [];

  registerAction('test_order_first', async () => {
    await firstGate.promise;
    completionOrder.push('first');
    return { type: 'reasoning', reasoning: 'first result' };
  });
  registerAction('test_order_second', async () => {
    completionOrder.push('second');
    secondFinished.resolve();
    return { type: 'reasoning', reasoning: 'second result' };
  });

  const pending = ActionRegistry.executeAll(
    [
      { id: 'call-first', name: 'test_order_first', arguments: {} },
      { id: 'call-second', name: 'test_order_second', arguments: {} },
    ],
    {},
  );

  await secondFinished.promise;
  assert.deepEqual(completionOrder, ['second']);
  firstGate.resolve();

  assert.deepEqual(await pending, [
    { type: 'reasoning', reasoning: 'first result' },
    { type: 'reasoning', reasoning: 'second result' },
  ]);
  assert.deepEqual(completionOrder, ['second', 'first']);
});

test('a failed action rejects the batch instead of reporting successful results', async () => {
  const failure = new Error('search unavailable');
  registerAction('test_failed_action', async () => { throw failure; });
  await assert.rejects(
    ActionRegistry.executeAll(
      [{ id: 'call-failed', name: 'test_failed_action', arguments: {} }],
      {},
    ),
    (error) => error === failure,
  );
});

test('a failed batch waits for every already-started action', async () => {
  const pending = Promise.withResolvers();
  const started = Promise.withResolvers();
  let settled = false;
  registerAction('test_wait_failure', async () => { throw new Error('first failed'); });
  registerAction('test_wait_pending', async () => {
    started.resolve();
    await pending.promise;
    return { type: 'reasoning', reasoning: 'finished sibling' };
  });
  const batch = ActionRegistry.executeAll([
    { id: 'failed', name: 'test_wait_failure', arguments: {} },
    { id: 'pending', name: 'test_wait_pending', arguments: {} },
  ], {});
  const rejected = assert.rejects(batch, /first failed/).then(() => { settled = true; });
  await started.promise;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
  pending.resolve();
  await rejected;
});

test('an invalid later call prevents any action in that batch from starting', async () => {
  let calls = 0;
  registerAction('test_no_partial_dispatch', async () => {
    calls += 1;
    return { type: 'reasoning', reasoning: 'must not run' };
  });
  await assert.rejects(ActionRegistry.executeAll([
    { id: 'first', name: 'test_no_partial_dispatch', arguments: {} },
    { id: 'invalid', name: 'test_action_not_registered', arguments: {} },
  ], {}), /not found/);
  assert.equal(calls, 0);
});
