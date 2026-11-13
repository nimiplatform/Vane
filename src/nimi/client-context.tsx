import { createContext, useContext, type ReactNode } from 'react';
import type { vane } from './client';
export type VaneClient = typeof vane & { kind: 'desktop' | 'web' };
const context = createContext<VaneClient | null>(null);
export function VaneClientProvider({
  client,
  children,
}: {
  client: VaneClient;
  children: ReactNode;
}) {
  return <context.Provider value={client}>{children}</context.Provider>;
}
export function useVane() {
  const client = useContext(context);
  if (!client) throw new Error('Vane client is unavailable.');
  return client;
}
