import { useEffect, useState } from "react";
import type { Feed } from "./lib/api";
import { Header } from "./components/Header";
import { StoryList } from "./components/StoryList";
import { StoryView } from "./components/StoryView";

type Route =
  | { kind: "list"; feed: Feed }
  | { kind: "story"; id: string };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "story" && parts[1]) {
    return { kind: "story", id: parts[1] };
  }
  const feeds: Feed[] = ["top", "new", "best", "ask", "show", "jobs"];
  const feed = (feeds as string[]).includes(parts[0])
    ? (parts[0] as Feed)
    : "top";
  return { kind: "list", feed };
}

function setHash(route: Route) {
  const target =
    route.kind === "story" ? `#/story/${route.id}` : `#/${route.feed}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen">
      <Header
        feed={route.kind === "list" ? route.feed : null}
        onFeedChange={(feed) => setHash({ kind: "list", feed })}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-10">
        {route.kind === "list" ? (
          <StoryList
            feed={route.feed}
            onOpenStory={(id) => setHash({ kind: "story", id: String(id) })}
          />
        ) : (
          <StoryView
            id={route.id}
            onBack={() => setHash({ kind: "list", feed: "top" })}
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
