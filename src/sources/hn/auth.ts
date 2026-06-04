import { isExtension } from "../../lib/runtime";

const HN = "https://news.ycombinator.com";

export type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "logged-in"; username: string };

/** Vote actions scraped from a logged-in item page, keyed by HN item id. */
export type VoteLinks = Map<
  number,
  { up: string | null; un: string | null }
>;

/** Where the user is sent to log in; opens real HN in a new tab. */
export const LOGIN_URL = `${HN}/login?goto=news`;

async function getText(path: string): Promise<string> {
  const res = await fetch(`${HN}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Determine whether the user is logged into news.ycombinator.com. Only meaningful
 * in the extension; the web build is always anonymous (it can't read HN's cookie).
 */
export async function fetchAuthState(): Promise<AuthState> {
  if (!isExtension()) return { status: "anonymous" };
  const html = await getText("/news");
  // The "login?goto=" link is shown only when logged out; when logged in the
  // top bar shows the username instead.
  if (/login\?goto=/.test(html)) return { status: "anonymous" };
  const user = html.match(/user\?id=([^"'&]+)/);
  return { status: "logged-in", username: user ? user[1] : "you" };
}

/** Parse vote links (with auth tokens) out of an HN page's HTML. */
function parseVoteLinks(html: string): VoteLinks {
  const links: VoteLinks = new Map();
  if (/login\?goto=/.test(html) || !/&amp;auth=/.test(html)) return links;

  const entry = (id: number) => {
    let e = links.get(id);
    if (!e) {
      e = { up: null, un: null };
      links.set(id, e);
    }
    return e;
  };

  // <a id='up_123' [class=...] href='vote?id=123&amp;how=up&amp;auth=...&amp;goto=...'>
  // Tolerant of extra attributes the logged-in markup may add between id and href.
  const re = /id=['"](up|un)_(\d+)['"][^>]*?href=['"]vote\?([^'"]+)['"]/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const [, kind, idStr, query] = m;
    const params = query.replace(/&amp;/g, "&");
    if (!/(?:^|&)auth=/.test(params)) continue; // logged-out arrow, not actionable
    const url = `${HN}/vote?${params}`;
    if (kind === "up") entry(Number(idStr)).up = url;
    else entry(Number(idStr)).un = url;
  }
  return links;
}

/**
 * Fetch an HN page (same-origin, with the user's cookie) and scrape its vote
 * links. Used for client-side navigation, where the page's own DOM no longer
 * matches the view we're showing. Empty map outside the extension / logged out.
 */
export async function fetchVoteLinksForUrl(url: string): Promise<VoteLinks> {
  if (!isExtension()) return new Map();
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return new Map();
    return parseVoteLinks(await res.text());
  } catch {
    return new Map();
  }
}

/** Vote links for a single item page (story + its comments). */
export function fetchVoteLinks(itemId: string): Promise<VoteLinks> {
  return fetchVoteLinksForUrl(`${HN}/item?id=${itemId}`);
}

/**
 * In-place reader: HN's own page is already in the DOM (we just hide it), so we
 * can read the vote links (with their auth tokens) directly — no extra request.
 * Works on feed pages (story arrows) and item pages (story + every comment).
 */
export function scrapeVoteLinksFromDOM(): VoteLinks {
  const links: VoteLinks = new Map();
  const anchors = document.querySelectorAll<HTMLAnchorElement>(
    'a[id^="up_"], a[id^="un_"]',
  );
  for (const a of anchors) {
    const m = a.id.match(/^(up|un)_(\d+)$/);
    if (!m) continue;
    const href = a.getAttribute("href") || "";
    if (!/[?&]auth=/.test(href)) continue; // logged-out arrow, not actionable
    const id = Number(m[2]);
    let e = links.get(id);
    if (!e) {
      e = { up: null, un: null };
      links.set(id, e);
    }
    const url = new URL(href, HN).href;
    if (m[1] === "up") e.up = url;
    else e.un = url;
  }
  return links;
}

/** Login state read from HN's own page DOM (no network). */
export function authStateFromDOM(): AuthState {
  // The top bar shows a logout link + the user's profile link when logged in.
  if (document.querySelector('a[href^="logout"]')) {
    const me = document.querySelector<HTMLAnchorElement>('#me, a[href^="user?id="]');
    const name = me?.textContent?.trim();
    return { status: "logged-in", username: name || "you" };
  }
  return { status: "anonymous" };
}

/** Perform a scraped vote/unvote URL (an HN vote is a plain GET). */
export async function castVote(url: string): Promise<void> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Vote failed: HTTP ${res.status}`);
}

export type CommentForm = { hmac: string; loggedIn: boolean };

/**
 * Get the top-level comment form token (hmac) for an item. Reads HN's DOM when
 * we're already on that item's page; otherwise fetches it same-origin. Returns
 * null outside the extension; loggedIn=false (no hmac) when logged out.
 */
async function fetchFormHmac(path: string): Promise<CommentForm | null> {
  if (!isExtension()) return null;
  try {
    const html = await getText(path);
    const loggedIn = !/login\?goto=/.test(html);
    const m = html.match(/name="hmac"\s+value="([^"]+)"/);
    return { hmac: m ? m[1] : "", loggedIn };
  } catch {
    return null;
  }
}

export async function getCommentForm(itemId: string): Promise<CommentForm | null> {
  if (!isExtension()) return null;
  const params = new URLSearchParams(location.search);
  if (location.pathname === "/item" && params.get("id") === itemId) {
    const el = document.querySelector<HTMLInputElement>(
      'form[action="comment"] input[name="hmac"]',
    );
    if (el?.value) return { hmac: el.value, loggedIn: true };
  }
  return fetchFormHmac(`/item?id=${itemId}`);
}

/** Reply form token for a specific comment (HN's /reply?id= page). */
export function getReplyForm(commentId: number): Promise<CommentForm | null> {
  return fetchFormHmac(`/reply?id=${commentId}`);
}

/** Post a top-level comment to an item. Returns true on success. */
export async function postComment(
  parentId: string,
  text: string,
  hmac: string,
): Promise<boolean> {
  const body = new URLSearchParams({
    parent: parentId,
    goto: `item?id=${parentId}`,
    hmac,
    text,
  });
  const res = await fetch(`${HN}/comment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  // HN answers 200 even when it rejects a post (rate-limited, expired hmac,
  // too long…), so res.ok isn't enough — a silent failure would discard the
  // user's text. On success HN redirects to the goto (the item page); a reject
  // re-renders the /comment page in place. Treat "landed on the item page" as
  // the success signal.
  return res.ok && (res.redirected || /\/item\?id=/.test(res.url));
}
