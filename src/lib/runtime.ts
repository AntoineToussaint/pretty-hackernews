/**
 * True when running inside the browser extension (where host permissions let us
 * fetch news.ycombinator.com cross-origin with the user's existing login
 * cookie). On the plain web build this is false, so all write/auth features
 * stay hidden and we never trigger a CORS failure.
 */
export function isExtension(): boolean {
  const chrome = (globalThis as unknown as { chrome?: { runtime?: { id?: string } } })
    .chrome;
  return Boolean(chrome?.runtime?.id);
}
