/**
 * Platform names that use ⌘ rather than Ctrl for shortcuts: Mac, iPhone, iPad (iPadOS also
 * reports itself as a Mac). Case-insensitive: Chromium reports "macOS", Safari "MacIntel". The
 * inline script in layouts/Base.astro receives this pattern and its flags through
 * define:vars, so the shortcuts map and the converter's tooltips agree.
 */
export const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

/** True on Apple devices. Client-only: on the server, and before hydration, it is false. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return APPLE_PLATFORM.test(nav.userAgentData?.platform ?? navigator.platform ?? '');
}
