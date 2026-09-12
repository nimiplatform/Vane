import { AsyncLocalStorage } from 'node:async_hooks';
import type { NimiElectronAppBusinessServices } from '@nimiplatform/kit/shell/electron/main';

export type VaneContext = {
  readonly services: NimiElectronAppBusinessServices;
  readonly signal: AbortSignal;
};
const context = new AsyncLocalStorage<VaneContext>();

export function inVaneContext<T>(scope: VaneContext, operation: () => T): T {
  scope.signal.throwIfAborted();
  return context.run(scope, operation);
}

export function vaneContext(): VaneContext {
  const scope = context.getStore();
  if (!scope) throw new Error('Vane work requires its App Host context.');
  scope.signal.throwIfAborted();
  return scope;
}

export async function whileVaneActive<T>(
  operation: (scope: VaneContext) => Promise<T>,
): Promise<T> {
  const scope = vaneContext();
  const result = await operation(scope);
  scope.signal.throwIfAborted();
  return result;
}
