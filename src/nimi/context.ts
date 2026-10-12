import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { NimiElectronAppBusinessServices } from '@nimiplatform/kit/shell/electron/main';

export type VaneContext = {
  readonly services: NimiElectronAppBusinessServices;
  readonly signal: AbortSignal;
};
const context = new AsyncLocalStorage<VaneContext>();

/** App work retains one ready binding; rebind never revives an old callback. */
export function createVaneBusinessContext() {
  let services: NimiElectronAppBusinessServices | undefined;
  let lifetime = new AbortController();
  let viewId = randomUUID();
  let closed = false;
  const invalidate = () => {
    lifetime.abort(new Error('Nimi context changed. The previous Vane work was canceled.'));
    services = undefined;
    viewId = randomUUID();
  };
  return {
    get viewId() {
      if (closed) throw new Error('The Vane App Host is unavailable.');
      return viewId;
    },
    current(): VaneContext {
      if (!services || closed) throw new Error('The Vane App Host is unavailable.');
      lifetime.signal.throwIfAborted();
      return { services, signal: lifetime.signal };
    },
    bind(value: NimiElectronAppBusinessServices) {
      if (closed) throw new Error('The Vane App Host is unavailable.');
      if (services) throw new Error('Vane services are already bound.');
      lifetime = new AbortController();
      services = value;
    },
    invalidate,
    close() {
      closed = true;
      invalidate();
    },
  };
}

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
