import { Capacitor } from '@capacitor/core';

/** Deliver a completed export through the carrier's user-visible save/share action. */
export async function exportFile(
  blob: Blob,
  filename: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const name = filename.replace(/[\x00-\x1f<>:"/\\|?*]/g, '-').slice(0, 160);
  if (!name || name === '.' || name === '..')
    throw new Error('Choose a valid export name.');
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob),
      link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { registerPlugin } = await import('@capacitor/core');
  const files = registerPlugin<{
    beginExport(input: { name: string }): Promise<{ id: string }>;
    appendExport(input: {
      id: string;
      offset: number;
      data: string;
    }): Promise<{ received: number }>;
    saveExport(input: {
      id: string;
    }): Promise<{ bytesWritten: number; name: string }>;
    abortExport(input: { id: string }): Promise<void>;
  }>('VaneFiles');
  const { id } = await files.beginExport({ name });
  try {
    let offset = 0;
    while (offset < blob.size) {
      signal.throwIfAborted();
      const bytes = new Uint8Array(
        await blob.slice(offset, offset + 65536).arrayBuffer(),
      );
      let value = '';
      for (let start = 0; start < bytes.length; start += 8192)
        value += String.fromCharCode(...bytes.subarray(start, start + 8192));
      const result = await files.appendExport({
        id,
        offset,
        data: btoa(value),
      });
      offset += bytes.length;
      if (result.received !== offset)
        throw new Error('The export transfer is incomplete.');
    }
    signal.throwIfAborted();
    const saved = await files.saveExport({ id });
    if (saved.bytesWritten !== blob.size)
      throw new Error('The file was not completely saved.');
  } catch (error) {
    await files.abortExport({ id }).catch(() => {});
    if ((error as { code?: string })?.code === 'VANE_EXPORT_CANCELED') return;
    throw error;
  }
}
