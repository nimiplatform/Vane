import { BrowserWindow } from 'electron';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { vaneContext } from '../nimi/context';

class Scraper {
  static async scrape(value: string): Promise<{ content: string; title: string }> {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Web page reading requires an HTTP or HTTPS URL.');
    const { signal } = vaneContext();
    const window = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, partition: `vane-reader-${crypto.randomUUID()}` },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    const close = () => { if (!window.isDestroyed()) window.destroy(); };
    signal.addEventListener('abort', close, { once: true });
    const timeout = setTimeout(close, 25_000);
    try {
      signal.throwIfAborted();
      await new Promise<void>((resolve, reject) => {
        window.webContents.once('dom-ready', () => resolve());
        void window.loadURL(url.toString()).catch(reject);
      });
      signal.throwIfAborted();
      const title = window.webContents.getTitle();
      const html = await window.webContents.mainFrame.executeJavaScript('document.documentElement.outerHTML') as string;
      signal.throwIfAborted();
      const document = new JSDOM(html, { url: url.toString() });
      try {
        const article = new Readability(document.window.document).parse();
        const text = article?.textContent?.trim();
        if (!text) throw new Error(`No readable article was found at ${url.hostname}.`);
        return { title, content: `# ${title}\n\n${text}` };
      } finally { document.window.close(); }
    } catch (error) {
      signal.throwIfAborted();
      throw new Error(`Vane could not read ${url.hostname}. Try the page again or use another URL.`, { cause: error });
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', close);
      close();
    }
  }
}
export default Scraper;
