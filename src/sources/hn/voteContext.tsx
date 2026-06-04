import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { castVote, type VoteLinks } from "./auth";

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

  // When `links` change (client-side nav, or the post-load vote-token re-fetch),
  // fold in any server-known "already voted" ids — but MERGE, never replace, so
  // a vote the user just cast optimistically is never wiped by a re-fetch that
  // predates it.
  useEffect(() => {
    setVoted((prev) => {
      if ([...initialVoted].every((id) => prev.has(id))) return prev;
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
        if (!link) return;
        const isVoted = voted.has(id);
        const url = isVoted ? link.un : link.up;
        if (!url || busy.has(id)) return;
        setBusyFlag(id, true);
        castVote(url)
          .then(() => {
            setVoted((prev) => {
              const next = new Set(prev);
              if (isVoted) next.delete(id);
              else next.add(id);
              return next;
            });
          })
          .catch(() => {
            /* leave state unchanged on failure */
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
