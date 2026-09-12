import { vaneContext } from './context';

export async function fetchForVane(url: string | URL, input: RequestInit = {}) {
  const { signal } = vaneContext();
  signal.throwIfAborted();
  const response = await fetch(url, {
    ...input,
    signal: AbortSignal.any([
      signal,
      AbortSignal.timeout(25_000),
      ...(input.signal ? [input.signal] : []),
    ]),
  });
  signal.throwIfAborted();
  if (!response.ok)
    throw new Error(
      `Request to ${new URL(url).hostname} failed (${response.status}).`,
    );
  return response;
}
