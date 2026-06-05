// Gated debug logging. Off by default so the console stays clean (and the
// "no noise / nothing hidden" trust story holds). Turn it on at runtime — no
// rebuild needed — from the page console on news.ycombinator.com:
//
//   hatch.debug(true)     // or:  localStorage['hatch:debug'] = '1'
//   hatch.debug(false)    // stop
//
// Logs appear in the same tab's DevTools console. (The background service
// worker has its own console: chrome://extensions → Pretty Hacker News → "service worker".)

const KEY = "hatch:debug";

/** Read fresh each call so toggling takes effect without a reload. */
export function debugEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false; // no localStorage (e.g. service worker)
  }
}

export function setDebug(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  // This confirmation always prints, regardless of the flag.
  console.info(`%c[hatch]%c debug ${on ? "ON" : "off"}`, "color:#ff6600;font-weight:bold", "color:inherit");
}

const STYLE = "color:#ff6600;font-weight:bold";

export function dlog(...args: unknown[]): void {
  if (debugEnabled()) console.log("%c[hatch]", STYLE, ...args);
}

export function dwarn(...args: unknown[]): void {
  if (debugEnabled()) console.warn("%c[hatch]", STYLE, ...args);
}

/** Time a labelled async op and log its duration when debug is on. */
export async function dtime<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!debugEnabled()) return fn();
  const t0 = performance.now();
  try {
    const r = await fn();
    dlog(`${label} ✓ ${(performance.now() - t0).toFixed(0)}ms`, r);
    return r;
  } catch (e) {
    dlog(`${label} ✗ ${(performance.now() - t0).toFixed(0)}ms`, e);
    throw e;
  }
}
