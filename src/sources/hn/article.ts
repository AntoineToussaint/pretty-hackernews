import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";
import { isExtension } from "../../lib/runtime";

export type Article = {
  title: string | null;
  image: string | null;
  /** Sanitized HTML of the article body. */
  html: string;
  excerpt: string | null;
};

type FetchResponse = { ok: true; html: string } | { ok: false; error: string };

type RuntimeApi = {
  sendMessage: (msg: unknown, cb: (res?: unknown) => void) => void;
  lastError?: unknown;
};

// Typed access to chrome.runtime without @types/chrome (this file is in the
// web build's import graph, where `chrome` is undefined).
function getRuntime(): RuntimeApi | null {
  return (
    (globalThis as unknown as { chrome?: { runtime?: RuntimeApi } }).chrome
      ?.runtime ?? null
  );
}

/** Ask the background worker to fetch the article HTML (cross-origin). */
function fetchHtml(url: string): Promise<string | null> {
  const runtime = isExtension() ? getRuntime() : null;
  if (!runtime) return Promise.resolve(null);
  return new Promise((resolve) => {
    runtime.sendMessage({ type: "hatch-fetch-article", url }, (res) => {
      const r = res as FetchResponse | undefined;
      if (runtime.lastError || !r || !r.ok) resolve(null);
      else resolve(r.html);
    });
  });
}

/** Open the extension's settings page, where previews can be enabled in one
 *  click. Content scripts can't call chrome.permissions.request themselves, so
 *  the in-page prompt routes the user to an extension page that can. */
export function openPreviewSettings(): void {
  const runtime = isExtension() ? getRuntime() : null;
  runtime?.sendMessage({ type: "hatch-open-options" }, () => void 0);
}

/** Whether the user has granted the optional permission needed for previews. */
export function hasPreviewPermission(): Promise<boolean> {
  const runtime = isExtension() ? getRuntime() : null;
  if (!runtime) return Promise.resolve(false);
  return new Promise((resolve) => {
    runtime.sendMessage({ type: "hatch-has-preview-permission" }, (res) => {
      const r = res as { granted?: boolean } | undefined;
      resolve(!runtime.lastError && !!r?.granted);
    });
  });
}

/** Extract a clean, sanitized article from raw HTML. */
function parse(html: string, url: string): Article | null {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Make relative URLs (images, links) resolve against the article's origin.
  const base = doc.createElement("base");
  base.href = url;
  doc.head?.prepend(base);

  const ogImageRaw = doc
    .querySelector('meta[property="og:image"], meta[name="og:image"]')
    ?.getAttribute("content");
  let image: string | null = null;
  if (ogImageRaw) {
    try {
      image = new URL(ogImageRaw, url).href;
    } catch {
      image = null;
    }
  }

  const parsed = new Readability(doc).parse();
  if (!parsed || !parsed.content) return null;

  return {
    title: parsed.title ?? null,
    image,
    html: DOMPurify.sanitize(parsed.content),
    excerpt: parsed.excerpt ?? null,
  };
}

/** Fetch + extract an article for the inline preview. */
export async function loadArticle(url: string): Promise<Article | null> {
  const html = await fetchHtml(url);
  if (!html) return null;
  try {
    return parse(html, url);
  } catch {
    return null;
  }
}
