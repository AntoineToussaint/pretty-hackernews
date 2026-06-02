import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StoryHit } from "./api";

type PrefsApi = {
  saved: StoryHit[];
  isSaved: (id: string) => boolean;
  toggleSave: (hit: StoryHit) => void;
  muted: string[];
  isMuted: (host: string | null) => boolean;
  mute: (host: string) => void;
  unmute: (host: string) => void;
};

// Default no-op (e.g. the standalone web app, which has no provider).
const PrefsContext = createContext<PrefsApi>({
  saved: [],
  isSaved: () => false,
  toggleSave: () => {},
  muted: [],
  isMuted: () => false,
  mute: () => {},
  unmute: () => {},
});

export function usePrefs() {
  return useContext(PrefsContext);
}

type LocalStore = {
  get: (keys: string[], cb: (items: Record<string, unknown>) => void) => void;
  set: (items: Record<string, unknown>) => void;
};
const store: LocalStore | null =
  (
    globalThis as unknown as {
      chrome?: { storage?: { local?: LocalStore } };
    }
  ).chrome?.storage?.local ?? null;

const SAVED = "savedStories";
const MUTED = "mutedDomains";

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<StoryHit[]>([]);
  const [muted, setMuted] = useState<string[]>([]);

  useEffect(() => {
    store?.get([SAVED, MUTED], (r) => {
      if (Array.isArray(r[SAVED])) setSaved(r[SAVED] as StoryHit[]);
      if (Array.isArray(r[MUTED])) setMuted(r[MUTED] as string[]);
    });
  }, []);

  const api = useMemo<PrefsApi>(() => {
    const savedIds = new Set(saved.map((s) => s.objectID));
    const mutedSet = new Set(muted);
    return {
      saved,
      isSaved: (id) => savedIds.has(id),
      toggleSave: (hit) =>
        setSaved((prev) => {
          const next = savedIds.has(hit.objectID)
            ? prev.filter((s) => s.objectID !== hit.objectID)
            : [hit, ...prev];
          store?.set({ [SAVED]: next });
          return next;
        }),
      muted,
      isMuted: (host) => !!host && mutedSet.has(host),
      mute: (host) =>
        setMuted((prev) => {
          if (prev.includes(host)) return prev;
          const next = [...prev, host].sort();
          store?.set({ [MUTED]: next });
          return next;
        }),
      unmute: (host) =>
        setMuted((prev) => {
          const next = prev.filter((h) => h !== host);
          store?.set({ [MUTED]: next });
          return next;
        }),
    };
  }, [saved, muted]);

  return <PrefsContext.Provider value={api}>{children}</PrefsContext.Provider>;
}
