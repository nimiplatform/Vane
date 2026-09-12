import { applyPatch } from 'rfc6902';
import type { Block } from './types';
import type { ResearchUpdate, ResearchStatus } from '../nimi/contracts';

type Listener = (event: string, data: any) => void;
const sessions = new Map<string, SessionManager>();

class SessionManager {
  readonly id: string;
  private blocks = new Map<string, Block>();
  private listeners = new Set<Listener>();
  private researchComplete?: Extract<
    ResearchUpdate,
    { type: 'researchComplete' }
  >;
  private terminal?: ResearchUpdate;
  private expiry?: ReturnType<typeof setTimeout>;

  constructor(
    id: string = crypto.randomUUID(),
    readonly signal: AbortSignal,
  ) {
    this.id = id;
  }

  static getSession(id: string) {
    return sessions.get(id);
  }
  static getAllSessions() {
    return [...sessions.values()];
  }
  static createSession(id: string, signal: AbortSignal) {
    if (sessions.has(id)) throw new Error('This research run already exists.');
    const session = new SessionManager(id, signal);
    sessions.set(id, session);
    return session;
  }
  static clear() {
    for (const session of sessions.values()) {
      session.removeAllListeners();
      clearTimeout(session.expiry);
    }
    sessions.clear();
  }
  removeAllListeners() {
    this.listeners.clear();
  }

  emit(event: string, data: any) {
    this.assertActive();
    if (event === 'data' && data.type === 'researchComplete')
      this.researchComplete = structuredClone(data);
    this.notify(event, data);
  }

  private assertActive() {
    this.signal.throwIfAborted();
    if (this.terminal) throw new Error('Research is already finished.');
  }

  private notify(event: string, data: any) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  finish(status: Exclude<ResearchStatus, 'answering'>, message?: string) {
    if (this.terminal) return;
    this.terminal =
      status === 'completed'
        ? { type: 'messageEnd' }
        : { type: 'error', status, data: message ?? 'Research stopped.' };
    this.notify('data', this.terminal);
    this.listeners.clear();
    this.expiry = setTimeout(() => sessions.delete(this.id), 30 * 60 * 1000);
    this.expiry.unref?.();
  }

  emitBlock(block: Block) {
    this.assertActive();
    this.blocks.set(block.id, block);
    this.emit('data', { type: 'block', block });
  }
  getBlock(blockId: string) {
    return this.blocks.get(blockId);
  }
  updateBlock(blockId: string, patch: any[]) {
    this.assertActive();
    const block = this.blocks.get(blockId);
    if (!block) throw new Error('Research block does not exist.');
    const errors = applyPatch(block, patch);
    if (errors.some(Boolean))
      throw new Error('Research block update is invalid.');
    this.emit('data', { type: 'updateBlock', blockId, patch });
  }
  getAllBlocks() {
    return structuredClone([...this.blocks.values()]);
  }

  subscribe(listener: Listener): () => void {
    // The current block projection is a complete reconnect snapshot. A token
    // stream transcript is unnecessary and would grow quadratically as blocks
    // are replaced. No tool execution is repeated by a subscription.
    for (const block of this.getAllBlocks())
      listener('data', { type: 'block', block });
    if (this.researchComplete)
      listener('data', structuredClone(this.researchComplete));
    if (this.terminal) listener('data', this.terminal);
    else this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export default SessionManager;
