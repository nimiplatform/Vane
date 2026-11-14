import {
  createWebNimiAppSession,
  type NimiRemoteAppConfig,
} from '@nimiplatform/kit/auth/app/web';
import { mountRemoteVane } from './remote-app';
declare const __NIMI_APP_WEB_CONFIG__: NimiRemoteAppConfig;
const dispose = mountRemoteVane(
  createWebNimiAppSession(__NIMI_APP_WEB_CONFIG__),
);
if (import.meta.hot) import.meta.hot.dispose(dispose);
