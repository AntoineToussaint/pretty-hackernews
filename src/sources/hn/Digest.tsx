import { useEffect, useState } from "react";
import type { StoryItem } from "./api";
import { aiConfigured, digestStory, type Digest as DigestData } from "./aiDigest";

type State =
  | { s: "checking" }
  | { s: "unconfigured" }
  | { s: "idle" }
  | { s: "loading" }
  | { s: "error"; msg: string }
  | { s: "ready"; data: DigestData };

const WORTH_LABEL: Record<DigestData["worth"], string> = {
  yes: "Worth your time",
  maybe: "Maybe worth it",
  no: "Probably skip",
};

export function Digest({ story }: { story: StoryItem }) {
  const [state, setState] = useState<State>({ s: "checking" });

  useEffect(() => {
    let cancelled = false;
    aiConfigured().then((ok) => {
      if (!cancelled) setState({ s: ok ? "idle" : "unconfigured" });
    });
    return () => {
      cancelled = true;
    };
  }, [story.id]);

  if (state.s === "checking" || state.s === "unconfigured") return null;

  const run = async () => {
    setState({ s: "loading" });
    const res = await digestStory(story);
    setState(res.ok ? { s: "ready", data: res.digest } : { s: "error", msg: res.error });
  };

  if (state.s === "idle" || state.s === "error") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={run}
          className="accent-bg inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          ✨ AI digest
        </button>
        {state.s === "error" && (
          <p className="text-xs text-[color:var(--color-fg-muted)]">{state.msg}</p>
        )}
      </div>
    );
  }

  if (state.s === "loading") {
    return (
      <div className="card p-4 text-sm text-[color:var(--color-fg-muted)]">
        Reading the thread for you…
      </div>
    );
  }

  const { data } = state;
  const worthColor =
    data.worth === "yes"
      ? "text-emerald-400"
      : data.worth === "no"
        ? "text-[color:var(--color-fg-muted)]"
        : "accent-text";

  return (
    <div className="card space-y-3 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-fg-muted)]">
          ✨ Digest
        </span>
        <span className={"text-xs font-semibold " + worthColor}>
          {WORTH_LABEL[data.worth]}
        </span>
      </div>
      <p className="text-[15px] leading-relaxed">{data.verdict}</p>
      {data.picks.length > 0 && (
        <ul className="space-y-2">
          {data.picks.map((p, i) => (
            <li
              key={i}
              className="rounded-lg border border-[color:var(--color-border)]/60 bg-[color:var(--color-bg-elev)]/40 p-2.5 text-sm"
            >
              <span className="font-semibold">{p.author}</span>
              <span
                className={
                  "ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                  (p.action === "reply"
                    ? "accent-bg text-white"
                    : "bg-[color:var(--color-bg)] text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)]")
                }
              >
                {p.action}
              </span>
              <p className="mt-1 text-[color:var(--color-fg-muted)]">{p.why}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
