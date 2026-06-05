import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { castVote, type VoteLinks } from "./auth";
import { dlog, dwarn } from "../../lib/debug";

const KEY = "votedIds";
const CAP = 2000; // bound storage growth

type LocalStore = {
  get: (key: string, cb: (items: Record<string, unknown>) => void) => void;
  set: (items: Record<string, unknown>) => void;
};

// Typed chrome.storage.local access without @types/chrome (shared with the web
// build, where `chrome` is undefined → store is null and nothing persists).
const store: LocalStore | null =
  (globalThis as unknown as { chrome?: { storage?: { local?: LocalStore } } })
    .chrome?.storage?.local ?? null;

type VoteApi = {
  enabled: boolean;
  /** Is there an actionable upvote link for this id? */
  canUpvote: (id: number) => boolean;
  hasVoted: (id: number) => boolean;
  pending: (id: number) => boolean;
  toggle: (id: number) => void;
};

const VoteContext = createContext<VoteApi>({
  enabled: false,
  canUpvote: () => false,
  hasVoted: () => false,
  pending: () => false,
  toggle: () => {},
});

export function useHnVote() {
  return useContext(VoteContext);
}

export function VoteProvider({
  links,
  children,
}: {
  links: VoteLinks | null;
  children: ReactNode;
}) {
  // Already-voted ids are those HN exposed an "unvote" link for.
  const initialVoted = useMemo(() => {
    const set = new Set<number>();
    if (links) for (const [id, l] of links) if (l.un) set.add(id);
    return set;
  }, [links]);

  const [voted, setVoted] = useState<Set<number>>(initialVoted);
  const [busy, setBusy] = useState<Set<number>>(() => new Set());

  // Load our own persisted record of votes cast through the extension, so we keep
  // showing "you voted" even on views where HN's DOM doesn't expose the
  // unvote link (e.g. feed pages often render only the up-arrow).
  useEffect(() => {
    store?.get(KEY, (r) => {
      const ids = r[KEY];
      if (Array.isArray(ids) && ids.length) {
        dlog("loaded persisted votes:", ids.length);
        setVoted((prev) => new Set([...prev, ...(ids as number[])]));
      }
    });
  }, []);

  // When `links` change (client-side nav, or the post-load vote-token re-fetch),
  // fold in any server-known "already voted" ids — but MERGE, never replace, so
  // a vote the user just cast optimistically is never wiped by a re-fetch that
  // predates it.
  useEffect(() => {
    setVoted((prev) => {
      if ([...initialVoted].every((id) => prev.has(id))) return prev;
      dlog("merging server-known votes:", initialVoted.size);
      return new Set([...prev, ...initialVoted]);
    });
  }, [initialVoted]);

  const api = useMemo<VoteApi>(() => {
    const enabled = Boolean(links && links.size > 0);

    const setBusyFlag = (id: number, on: boolean) =>
      setBusy((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });

    return {
      enabled,
      canUpvote: (id) => Boolean(links?.get(id)?.up) && !voted.has(id),
      hasVoted: (id) => voted.has(id),
      pending: (id) => busy.has(id),
      toggle: (id) => {
        const link = links?.get(id);
        const isVoted = voted.has(id);
        const url = isVoted ? link?.un : link?.up;
        if (!url) {
          dwarn("no actionable vote link for", id, {
            isVoted,
            hasLink: !!link,
            up: link?.up ?? null,
            un: link?.un ?? null,
          });
          return;
        }
        if (busy.has(id)) return;
        dlog(`${isVoted ? "unvote" : "upvote"} ${id} →`, url);
        setBusyFlag(id, true);
        castVote(url)
          .then(() => {
            dlog(`${isVoted ? "unvote" : "upvote"} ${id} ✓`);
            setVoted((prev) => {
              const next = new Set(prev);
              if (isVoted) next.delete(id);
              else next.add(id);
              store?.set({ [KEY]: [...next].slice(-CAP) });
              return next;
            });
          })
          .catch((e) => {
            dwarn(`vote ${id} failed`, e);
          })
          .finally(() => setBusyFlag(id, false));
      },
    };
  }, [links, voted, busy]);

  return <VoteContext.Provider value={api}>{children}</VoteContext.Provider>;
}

/** Upvote arrow shown only when an actionable vote link exists for the item. */
export function Upvote({ id }: { id: number }) {
  const vote = useHnVote();
  if (!vote.enabled) return null;
  const voted = vote.hasVoted(id);
  // Nothing to do for this id (e.g. your own post, or no link scraped).
  if (!voted && !vote.canUpvote(id)) return null;

  return (
    <button
      type="button"
      onClick={() => vote.toggle(id)}
      disabled={vote.pending(id)}
      aria-pressed={voted}
      aria-label={voted ? "Unvote" : "Upvote"}
      className={
        "inline-grid size-5 place-items-center rounded-md transition disabled:opacity-40 " +
        (voted
          ? "text-[color:var(--color-accent)]"
          : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
      }
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 4l8 10h-5v6H9v-6H4z" />
      </svg>
    </button>
  );
}
