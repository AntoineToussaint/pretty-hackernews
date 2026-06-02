import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SeenApi = {
  isSeen: (id: number) => boolean;
  markSeen: (id: number) => void;
};

// Default no-op: with no provider (e.g. the standalone web app) nothing is
// tracked or dimmed.
const SeenContext = createContext<SeenApi>({
  isSeen: () => false,
  markSeen: () => {},
});

export function useSeen() {
  return useContext(SeenContext);
}

const KEY = "seenIds";
const CAP = 1000; // keep the most recent N to bound storage growth

type LocalStore = {
  get: (key: string, cb: (items: Record<string, unknown>) => void) => void;
  set: (items: Record<string, unknown>) => void;
};

// Typed access to chrome.storage.local without depending on @types/chrome
// (this file is shared with the web build, where `chrome` is undefined).
const store: LocalStore | null =
  (
    globalThis as unknown as {
      chrome?: { storage?: { local?: LocalStore } };
    }
  ).chrome?.storage?.local ?? null;

export function SeenProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    store?.get(KEY, (r) => {
      const ids = r[KEY];
      if (Array.isArray(ids)) setSeen(new Set(ids));
    });
  }, []);

  const api = useMemo<SeenApi>(
    () => ({
      isSeen: (id) => seen.has(id),
      markSeen: (id) =>
        setSeen((prev) => {
          if (prev.has(id)) return prev;
          const arr = [...prev, id].slice(-CAP);
          store?.set({ [KEY]: arr });
          return new Set(arr);
        }),
    }),
    [seen],
  );

  return <SeenContext.Provider value={api}>{children}</SeenContext.Provider>;
}
