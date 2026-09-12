import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  session,
  webContents,
  shell,
} from 'electron';
import {
  isAllowedElectronRendererUrl,
  registerNimiElectronAppAssetProtocolScheme,
  registerNimiElectronAppBridge,
} from '@nimiplatform/kit/shell/electron/main';

declare const __NIMI_ELECTRON_PRODUCTION__: boolean;

import { APP_ID } from '../src/nimi/constants.js';
import { createVaneHost } from '../src/nimi/host.js';
const vaneHost = createVaneHost();
let mainWindow: BrowserWindow | undefined;
let bridge: ReturnType<typeof registerNimiElectronAppBridge> | undefined;
let quitting = false;
const NATIVE_BUNDLE_IDENTIFIER = 'ai.nimi.apps.nimiplatform.vane';
const IS_PRODUCTION_BUNDLE =
  typeof __NIMI_ELECTRON_PRODUCTION__ !== 'undefined' &&
  __NIMI_ELECTRON_PRODUCTION__;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(currentDir, '..');
const preloadPath = path.join(currentDir, 'preload.cjs');
const productionRendererUrl = pathToFileURL(
  path.join(appRoot, 'dist', 'index.html'),
).toString();
const developmentRendererUrl = readDevelopmentRendererUrl();
const rendererUrl = developmentRendererUrl || productionRendererUrl;
const allowedRendererUrls = [rendererUrl];

app.setName('Vane');
app.setAppUserModelId(NATIVE_BUNDLE_IDENTIFIER);
Menu.setApplicationMenu(null);
registerNimiElectronAppAssetProtocolScheme(protocol);

void app.whenReady().then(async () => {
  bridge = registerNimiElectronAppBridge({
    appId: APP_ID,
    allowedRendererUrls,
    assetMediaPlatform: {
      protocol,
      webRequest: session.defaultSession.webRequest,
      webContents,
    },
    ipcMain,
    appCommandHandlers: vaneHost.commands,
    onSessionInvalidated: () => {
      vaneHost.invalidate();
      if (!quitting && mainWindow && !mainWindow.isDestroyed())
        mainWindow.reload();
    },
  });
  vaneHost.bind(bridge.services);
  await createMainWindow();
  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) void createMainWindow();
  });
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Vane startup failed:', message);
  dialog.showErrorBox('Vane could not start', message);
  app.exit(1);
});

app.on('before-quit', () => {
  quitting = true;
  vaneHost.close();
  bridge?.unregister();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function createMainWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 360,
    minHeight: 560,
    title: 'Vane',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = window;
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined;
  });
  window.webContents.on('did-start-navigation', (_event, _url, inPlace) => {
    if (!inPlace) vaneHost.disconnectObservers();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedElectronRendererUrl(url, allowedRendererUrls)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) void shell.openExternal(url);
    }
  });
  await window.loadURL(rendererUrl);
}

function readDevelopmentRendererUrl(): string {
  const flag = '--nimi-dev-renderer-url';
  const prefix = '--nimi-dev-renderer-url=';
  const hasDevelopmentRendererArgument = process.argv.some(
    (value) => value === flag || value.startsWith(prefix),
  );
  if (IS_PRODUCTION_BUNDLE && hasDevelopmentRendererArgument) {
    throw new Error(
      'The production Electron bundle rejects --nimi-dev-renderer-url.',
    );
  }
  if (process.argv.includes(flag))
    throw new Error('Nimi development renderer URL is missing.');
  const values = process.argv.filter((value) => value.startsWith(prefix));
  if (values.length === 0) return '';
  if (values.length !== 1)
    throw new Error('Nimi development renderer URL must be singular.');
  const selected = values[0];
  if (!selected) throw new Error('Nimi development renderer URL is missing.');
  const raw = selected.slice(prefix.length);
  const parsed = new URL(raw);
  if (
    parsed.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]', '::1'].includes(
      parsed.hostname.toLowerCase(),
    ) ||
    !parsed.port ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== '/' && parsed.pathname !== '') ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('Nimi development renderer URL must be exact loopback.');
  }
  return parsed.origin;
}
