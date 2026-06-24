import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_HOSTNAME,
  RECAPTCHA_TEST_SITE_KEY,
  resolveRecaptchaSiteKey,
  shouldUseRecaptchaTestKeys,
} from './submitEnv';

describe('shouldUseRecaptchaTestKeys', () => {
  it('uses test keys on localhost and dev', () => {
    expect(shouldUseRecaptchaTestKeys({ isDev: true })).toBe(true);
    expect(shouldUseRecaptchaTestKeys({ hostname: 'localhost' })).toBe(true);
    expect(shouldUseRecaptchaTestKeys({ hostname: '127.0.0.1' })).toBe(true);
  });

  it('uses production keys on GitHub Pages hostname', () => {
    expect(shouldUseRecaptchaTestKeys({ hostname: PRODUCTION_HOSTNAME })).toBe(false);
  });
});

describe('resolveRecaptchaSiteKey', () => {
  it('uses test key in dev', () => {
    expect(resolveRecaptchaSiteKey('prod-site-key', true, 'localhost')).toBe(RECAPTCHA_TEST_SITE_KEY);
  });

  it('uses production key on production hostname', () => {
    expect(resolveRecaptchaSiteKey('prod-site-key', false, PRODUCTION_HOSTNAME)).toBe(
      'prod-site-key',
    );
  });
});
