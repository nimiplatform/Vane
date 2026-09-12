import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import SessionManager from './session.ts';

afterEach(() => SessionManager.clear());

test('reconnecting observes current blocks, budget reason and terminal result without replay', () => {
  const session = SessionManager.createSession('reconnect', new AbortController().signal);
  const events = [];
  const unsubscribe = session.subscribe((_event, update) => events.push(update.type));
  session.emitBlock({ id: 'answer', type: 'text', data: 'partial' });
  unsubscribe();
  session.updateBlock('answer', [{ op: 'replace', path: '/data', value: 'final' }]);
  session.emit('data', { type: 'researchComplete', reason: 'budget' });
  session.finish('completed');

  const snapshot = [];
  session.subscribe((_event, update) => snapshot.push(update));
  assert.deepEqual(events, ['block']);
  assert.deepEqual(snapshot, [
    { type: 'block', block: { id: 'answer', type: 'text', data: 'final' } },
    { type: 'researchComplete', reason: 'budget' },
    { type: 'messageEnd' },
  ]);
});

test('cancellation prevents late block mutation while retaining a visible terminal state', () => {
  const controller = new AbortController();
  const session = SessionManager.createSession('cancel', controller.signal);
  session.emitBlock({ id: 'answer', type: 'text', data: 'partial' });
  controller.abort(new Error('Research canceled.'));
  session.finish('canceled', 'Research canceled.');
  assert.throws(() => session.updateBlock('answer', [
    { op: 'replace', path: '/data', value: 'late output' },
  ]), /Research canceled/);
  const snapshot = [];
  session.subscribe((_event, update) => snapshot.push(update));
  assert.equal(snapshot[0].block.data, 'partial');
  assert.deepEqual(snapshot[1], { type: 'error', status: 'canceled', data: 'Research canceled.' });
});

test('a finished run rejects late output before changing its saved projection', () => {
  const session = SessionManager.createSession('finished', new AbortController().signal);
  session.emitBlock({ id: 'answer', type: 'text', data: 'final' });
  session.finish('completed');
  assert.throws(() => session.emitBlock({ id: 'late', type: 'text', data: 'late' }), /already finished/);
  assert.throws(() => session.updateBlock('answer', [{ op: 'replace', path: '/data', value: 'late' }]), /already finished/);
  assert.equal(session.getAllBlocks().length, 1);
  assert.equal(session.getAllBlocks()[0].data, 'final');
});
