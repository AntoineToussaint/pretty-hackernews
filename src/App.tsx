import { useEffect, useState } from "react";
import { DEFAULT_THEME, isThemeId, THEME_IDS, type ThemeId } from "./lib/themes";
import { DEFAULT_SOURCE_ID, SOURCES, getSource } from "./sources/registry";
import { Header } from "./components/Header";
import { Settings } from "./components/Settings";
import { SettingsModal } from "./components/SettingsModal";

type Route =
  | { kind: "list"; sourceId: string; feedId: string }
  | { kind: "item"; sourceId: string; itemId: string }
  | { kind: "settings" };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);

  if (parts[0] === "settings") return { kind: "settings" };

  // First segment selects the source when it names a known one; otherwise we
  // fall back to the default source and treat the whole hash as a feed/item
  // path (keeps older "#/top" and "#/story/123" links working).
  let sourceId = DEFAULT_SOURCE_ID;
  let rest = parts;
  if (parts[0] && SOURCES.some((s) => s.id === parts[0])) {
    sourceId = parts[0];
    rest = parts.slice(1);
  }
  const source = getSource(sourceId);

  if ((rest[0] === "item" || rest[0] === "story") && rest[1]) {
    return { kind: "item", sourceId, itemId: rest[1] };
  }
  const feedId = source.feeds.some((f) => f.id === rest[0])
    ? rest[0]
    : source.defaultFeed;
  return { kind: "list", sourceId, feedId };
}

const listHash = (sourceId: string, feedId: string) => `#/${sourceId}/${feedId}`;
const itemHash = (sourceId: string, itemId: string) =>
  `#/${sourceId}/item/${itemId}`;

function setHash(target: string) {
  if (window.location.hash !== target) window.location.hash = target;
}

function getInitialTheme(): ThemeId {
  const stored = localStorage.getItem("theme");
  if (isThemeId(stored)) return stored;
  return DEFAULT_THEME;
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [theme, setTheme] = useState<ThemeId>(getInitialTheme);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    for (const id of THEME_IDS) html.classList.remove(`theme-${id}`);
    html.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const source = getSource(route.kind === "settings" ? DEFAULT_SOURCE_ID : route.sourceId);
  const { FeedView, ItemView } = source;

  return (
    <div className="min-h-screen">
      <Header
        sources={SOURCES}
        activeSource={source}
        onSourceChange={(id) => {
          const next = getSource(id);
          setHash(listHash(next.id, next.defaultFeed));
        }}
        feedId={route.kind === "list" ? route.feedId : null}
        onFeedChange={(feedId) => setHash(listHash(source.id, feedId))}
        onOpenItem={(id) => setHash(itemHash(source.id, id))}
        theme={theme}
        onThemeChange={setTheme}
        showThemeSwitcher={false}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {settingsOpen && (
        <SettingsModal
          theme={theme}
          onThemeChange={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-10">
        {route.kind === "settings" ? (
          <Settings
            theme={theme}
            onThemeChange={setTheme}
            onBack={() => setHash(listHash(source.id, source.defaultFeed))}
          />
        ) : route.kind === "list" ? (
          <FeedView
            feedId={route.feedId}
            onOpenItem={(id) => setHash(itemHash(source.id, id))}
          />
        ) : (
          <ItemView
            itemId={route.itemId}
            onBack={() => setHash(listHash(source.id, source.defaultFeed))}
          />
        )}
      </main>
      <footer className="mx-auto max-w-3xl px-4 pb-12 text-center text-xs text-[color:var(--color-fg-muted)]">
        Feeds from the official{" "}
        <a
          className="underline-offset-2 hover:underline"
          href="https://github.com/HackerNews/API"
          target="_blank"
          rel="noreferrer"
        >
          HN Firebase API
        </a>
        ; comment threads from{" "}
        <a
          className="underline-offset-2 hover:underline"
          href="https://hn.algolia.com/api"
          target="_blank"
          rel="noreferrer"
        >
          HN Algolia
        </a>
        . Not affiliated with Y Combinator.
      </footer>
    </div>
  );
}
