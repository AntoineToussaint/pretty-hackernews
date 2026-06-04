import { test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

// These tests are the "I'm not messing with your login" guarantees, enforced
// mechanically against the source. They run in CI and anyone can read them.

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const files: [string, string][] = walk("src").map((p) => [
  p,
  readFileSync(p, "utf8"),
]);

test("never reads document.cookie", () => {
  const offenders = files
    .filter(([, src]) => src.includes("document.cookie"))
    .map(([p]) => p);
  expect(offenders).toEqual([]);
});

test("no analytics or tracking SDKs", () => {
  const re =
    /google-analytics|googletagmanager|mixpanel|segment\.(io|com)|amplitude|posthog|sentry\.io|fullstory|hotjar/i;
  const offenders = files.filter(([, src]) => re.test(src)).map(([p]) => p);
  expect(offenders).toEqual([]);
});

test("the logged-in session (credentials: include) is only ever sent to Hacker News", () => {
  const offenders = files
    .filter(
      ([, src]) =>
        /credentials:\s*["']include["']/.test(src) &&
        !src.includes("news.ycombinator.com"),
    )
    .map(([p]) => p);
  expect(offenders).toEqual([]);
});

test("article previews are fetched WITHOUT credentials (no cookies sent to other sites)", () => {
  const bg = files.find(([p]) => p.endsWith("background.ts"))?.[1] ?? "";
  // the article fetch lives in the background worker and must omit credentials
  expect(bg).toContain("hatch-fetch-article");
  expect(bg).toContain('credentials: "omit"');
  expect(bg).not.toMatch(/credentials:\s*["']include["']/);
});

test("the LLM client only calls Anthropic or OpenAI", () => {
  const llm = files.find(([p]) => p.endsWith("lib/llm.ts"))?.[1] ?? "";
  const hosts = [...llm.matchAll(/https?:\/\/([^/"'\s]+)/g)].map((m) => m[1]);
  expect(hosts.length).toBeGreaterThan(0);
  for (const h of hosts) {
    expect(["api.anthropic.com", "api.openai.com"]).toContain(h);
  }
});

test("makes no network calls outside the documented allowlist", () => {
  // Every host the source may reference, and why each is allowed. Adding a new
  // outbound host without updating this list (and the privacy policy) fails CI.
  // This keeps the code and the privacy disclosures provably in sync.
  const ALLOWED = new Set([
    "news.ycombinator.com", // HN itself — feed/comments + your own HN login
    "hacker-news.firebaseio.com", // HN's official public API (anonymous reads)
    "hn.algolia.com", // HN's official search/data API (anonymous reads)
    "www.google.com", // site favicons
    "fonts.googleapis.com", // the Inter web font
    "api.anthropic.com", // opt-in AI: your key, only when you trigger it
    "api.openai.com", // opt-in AI: your key, only when you trigger it
    "github.com", // footer link in the web app — not a data call
    "tailwindcss.com", // footer link in the web app — not a data call
  ]);
  const offenders = new Set<string>();
  for (const [, src] of files) {
    for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
      const host = m[1].toLowerCase();
      if (!ALLOWED.has(host)) offenders.add(host);
    }
  }
  expect([...offenders]).toEqual([]);
});
