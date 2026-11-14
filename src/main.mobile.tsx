import { createMobileNimiAppSession } from '@nimiplatform/kit/auth/app/mobile';
import type { NimiRemoteAppConfig } from '@nimiplatform/kit/core/app-session';
import { mountRemoteVane } from './remote-app';
import { Browser } from '@capacitor/browser';
import { toast } from 'sonner';
declare const __NIMI_APP_MOBILE_CONFIG__: Omit<NimiRemoteAppConfig, 'fetch'>;
const dispose = mountRemoteVane(
  createMobileNimiAppSession(__NIMI_APP_MOBILE_CONFIG__),
  true,
);
const openSource = (event: MouseEvent) => {
  const link =
    event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!(link instanceof HTMLAnchorElement)) return;
  const url = new URL(link.href, location.href);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.origin === location.origin
  )
    return;
  event.preventDefault();
  void Browser.open({ url: url.href }).catch(() =>
    toast.error('The source could not be opened.'),
  );
};
document.addEventListener('click', openSource, true);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    document.removeEventListener('click', openSource, true);
    dispose();
  });
