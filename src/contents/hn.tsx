import type { PlasmoCSConfig } from "plasmo";
import cssText from "data-text:../compiled.css";
import interFontUrl from "url:../../assets/InterVariable.woff2";
import { useEffect, useRef, useState } from "react";

import { Header } from "../components/Header";
import { SettingsModal } from "../components/SettingsModal";
import { hnSource } from "../sources/hn";
import {
  authStateFromDOM,
  fetchVoteLinksForUrl,
  scrapeVoteLinksFromDOM,
  type VoteLinks,
} from "../sources/hn/auth";
import { dlog, setDebug } from "../lib/debug";
import { VoteProvider } from "../sources/hn/voteContext";
import { SeenProvider } from "../sources/hn/seenContext";
import { PrefsProvider } from "../sources/hn/prefsContext";
import { SavedList } from "../sources/hn/SavedList";
import { SOURCES } from "../sources/registry";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "../lib/themes";

export const config: PlasmoCSConfig = {
  matches: ["https://news.ycombinator.com/*"],
  run_at: "document_start",
};

type Route =
  | { kind: "feed"; feedId: string }
  | { kind: "item"; itemId: string }
  | null;

const PATH_TO_FEED: Record<string, string> = {
  "/": "top",
  "/news": "top",
  "/newest": "new",
  "/best": "best",
  "/ask": "ask",
  "/show": "show",
  "/jobs": "jobs",
};

const FEED_TO_PATH: Record<string, string> = {
  top: "/news",
  new: "/newest",
  best: "/best",
  ask: "/ask",
  show: "/show",
  jobs: "/jobs",
};

/** Map HN's real URL to one of our views, or null to leave HN native. */
function routeFor(): Route {
  const path = location.pathname;
  const id = new URLSearchParams(location.search).get("id");
  if (path === "/item" && id) return { kind: "item", itemId: id };
  if (path in PATH_TO_FEED) return { kind: "feed", feedId: PATH_TO_FEED[path] };
  return null; // login, submit, user, reply, etc. — stay native
}

// Inject our compiled Tailwind + theme CSS into Plasmo's default shadow root.
// IMPORTANT: do NOT export getRootContainer — that disables the shadow DOM and
// getStyle injection, which is what left the UI completely unstyled.
export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

export default function HNReader() {
  const [route, setRoute] = useState<Route>(() => routeFor());
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [voteLinks, setVoteLinks] = useState<VoteLinks | null>(null);
  const [defaultFeed, setDefaultFeed] = useState("top");
  const scrollRef = useRef<HTMLDivElement>(null);
  const voteLinksRef = useRef<VoteLinks | null>(voteLinks);
  voteLinksRef.current = voteLinks;
  // The URL we originally loaded — while it matches, HN's own DOM is valid to
  // scrape; after a client-side nav it no longer matches, so we fetch instead.
  const initialUrl = useRef(location.pathname + location.search);

  const active = route !== null;

  // Inter is bundled in the extension (no third-party font host). We inject the
  // @font-face into the page document so it's available to our shadow content;
  // interFontUrl is a chrome-extension:// URL Plasmo exposes as a
  // web_accessible_resource. CSP on HN is stripped so the font can load.
  useEffect(() => {
    if (document.getElementById("hatch-font")) return;
    const style = document.createElement("style");
    style.id = "hatch-font";
    style.textContent = `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url("${interFontUrl}") format("woff2");}`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    chrome.storage?.local.get("theme", (r) => {
      if (isThemeId(r?.theme)) setTheme(r.theme as ThemeId);
    });
  }, []);

  useEffect(() => {
    chrome.storage?.local.set({ theme });
  }, [theme]);

  // Console inspector — lets you poke at state and flip on verbose logging from
  // the page's DevTools console without a rebuild. Only on pages we actually
  // skin, so non-reader HN pages keep a clean console. See src/lib/debug.ts.
  useEffect(() => {
    if (!active) return;
    const g = globalThis as unknown as { hatch?: unknown };
    g.hatch = {
      debug: (on = true) => setDebug(on),
      voteLinks: () => scrapeVoteLinksFromDOM(), // re-scrape HN's DOM now
      applied: () => voteLinksRef.current, // what the reader is currently using
      auth: () => authStateFromDOM(),
    };
    console.info(
      "%c[hatch]%c loaded — run hatch.debug(true) here for verbose logs; hatch.voteLinks() / hatch.auth() to inspect",
      "color:#ff6600;font-weight:bold",
      "color:inherit",
    );
    return () => {
      delete (g as { hatch?: unknown }).hatch;
    };
  }, [active]);

  // Default feed: redirect the bare homepage ("/") to the preferred feed.
  useEffect(() => {
    chrome.storage?.local.get("defaultFeed", (r) => {
      const f = typeof r?.defaultFeed === "string" ? r.defaultFeed : "top";
      setDefaultFeed(f);
      if (location.pathname === "/" && f !== "top" && FEED_TO_PATH[f]) {
        history.replaceState({}, "", FEED_TO_PATH[f]);
        setRoute(routeFor());
      }
    });
  }, []);

  const changeDefaultFeed = (f: string) => {
    setDefaultFeed(f);
    chrome.storage?.local.set({ defaultFeed: f });
  };

  // Hide HN's native content while we're active (once — survives view changes).
  useEffect(() => {
    if (!active) return;
    const hn = document.getElementById("hnmain") as HTMLElement | null;
    const prev = hn?.style.display ?? "";
    if (hn) hn.style.display = "none";
    document.documentElement.style.background = "#0a0a0c";
    return () => {
      if (hn) hn.style.display = prev;
    };
  }, [active]);

  // Back/forward buttons → re-derive the view from the URL.
  useEffect(() => {
    const onPop = () => setRoute(routeFor());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Vote tokens for the current view. Belt-and-suspenders: try HN's DOM (fast,
  // when we're on the page) AND fetch the URL same-origin (reliable). Whichever
  // yields tokens wins; the fetch is authoritative and resolves last.
  useEffect(() => {
    if (!route) return;
    let cancelled = false;
    const apply = (l: VoteLinks, src: string) => {
      if (cancelled) return;
      if (l.size > 0) {
        dlog(`vote links applied (${src}):`, l.size);
        setVoteLinks(l);
      }
    };
    apply(scrapeVoteLinksFromDOM(), "dom");
    const onLoad = () => apply(scrapeVoteLinksFromDOM(), "dom-load");
    window.addEventListener("load", onLoad, { once: true });
    fetchVoteLinksForUrl(location.href).then((l) => apply(l, "fetch"));
    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
    };
  }, [route]);

  // Scroll our overlay (the scroll container) to top on each view change.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [route]);

  // Client-side navigation: keep the real HN URL (links/back work), no reload.
  const navigate = (path: string) => {
    setSavedOpen(false);
    history.pushState({}, "", path);
    setRoute(routeFor());
  };
  const openItem = (id: string) => navigate(`/item?id=${id}`);

  if (!route) return null; // native HN page — render nothing

  const { FeedView, ItemView } = hnSource;

  // Full-screen overlay; theme class scopes the CSS variables inside the shadow.
  return (
    <PrefsProvider>
    <SeenProvider>
    <VoteProvider links={voteLinks}>
    <div
      ref={scrollRef}
      className={`theme-${theme}`}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "auto",
        zIndex: 2147483600,
        color: "var(--color-fg)",
        // Font + smoothing must be set here: inside the shadow root we don't
        // inherit the page's font, and @theme's :root vars don't reach us.
        fontFamily:
          '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        // Ambient accent backdrop over the base colour (mirrors the reader).
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 10%, color-mix(in oklab, var(--color-accent-2) 10%, transparent), transparent 60%), var(--color-bg)",
      }}
    >
      <Header
        sources={SOURCES}
        activeSource={hnSource}
        onSourceChange={() => {}}
        feedId={route.kind === "feed" ? route.feedId : null}
        onFeedChange={(f) => navigate(FEED_TO_PATH[f] ?? "/news")}
        onOpenItem={openItem}
        onHome={() => navigate(FEED_TO_PATH[defaultFeed] ?? "/news")}
        showSearch={false}
        showSettings={true}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleSaved={() => setSavedOpen((v) => !v)}
        savedActive={savedOpen}
      />
      {settingsOpen && (
        <SettingsModal
          theme={theme}
          onThemeChange={setTheme}
          onClose={() => setSettingsOpen(false)}
          feeds={hnSource.feeds}
          defaultFeed={defaultFeed}
          onDefaultFeedChange={changeDefaultFeed}
        />
      )}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-10">
        {savedOpen ? (
          <>
            <h2 className="mb-4 px-1 text-lg font-semibold tracking-tight">
              Saved
            </h2>
            <SavedList onOpenItem={openItem} />
          </>
        ) : route.kind === "feed" ? (
          <FeedView feedId={route.feedId} onOpenItem={openItem} />
        ) : (
          <ItemView itemId={route.itemId} onBack={() => navigate("/news")} />
        )}
      </main>
    </div>
    </VoteProvider>
    </SeenProvider>
    </PrefsProvider>
  );
}
