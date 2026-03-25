import { describe, expect, it } from 'vitest';
import { getInstallHelpVariant, isIosDevice } from './installability';

describe('installability helpers', () => {
  it('detects iOS devices', () => {
    expect(
      isIosDevice({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it('returns ios help variant for Safari on iOS', () => {
    expect(
      getInstallHelpVariant({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
        isSecureContext: true,
        hasServiceWorker: true,
        isInstalled: false,
      }),
    ).toBe('ios');
  });

  it('returns browser-menu help variant for secure non-iOS browsers', () => {
    expect(
      getInstallHelpVariant({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
        platform: 'MacIntel',
        maxTouchPoints: 0,
        isSecureContext: true,
        hasServiceWorker: true,
        isInstalled: false,
      }),
    ).toBe('browser-menu');
  });

  it('returns null for installed apps', () => {
    expect(
      getInstallHelpVariant({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
        platform: 'MacIntel',
        maxTouchPoints: 0,
        isSecureContext: true,
        hasServiceWorker: true,
        isInstalled: true,
      }),
    ).toBeNull();
  });
});
