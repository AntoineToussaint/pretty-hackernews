import { useEffect, useState } from "react";
import { fetchFeed, type Feed, type StoryHit } from "./api";

const POLL_MS = 60_000;

export type FeedState = {
  hits: StoryHit[] | null;
  error: string | null;
  lastUpdated: number | null;
  refreshing: boolean;
};

export function useFeedAutoRefresh(feed: Feed): FeedState {
  const [state, setState] = useState<FeedState>({
    hits: null,
    error: null,
    lastUpdated: null,
    refreshing: false,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    setState({
      hits: null,
      error: null,
      lastUpdated: null,
      refreshing: false,
    });

    const load = async (silent: boolean) => {
      if (silent) {
        setState((s) => ({ ...s, refreshing: true }));
      }
      try {
        const data = await fetchFeed(feed);
        if (cancelled) return;
        setState({
          hits: data,
          error: null,
          lastUpdated: Date.now(),
          refreshing: false,
        });
      } catch (e: unknown) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        setState((s) => ({
          ...s,
          error: silent ? s.error : message,
          refreshing: false,
        }));
      }
    };

    const startPolling = () => {
      stopPolling();
      timer = window.setInterval(() => void load(true), POLL_MS);
    };
    const stopPolling = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void load(true);
        startPolling();
      } else {
        stopPolling();
      }
    };

    void load(false);
    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [feed]);

  return state;
}
