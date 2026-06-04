import { useEffect, useRef, useState } from "react";
import type { StoryItem } from "./api";
import { aiConfigured, digestStory, type Digest as DigestData } from "./aiDigest";

function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={"animate-spin " + className}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const LOADING_STEPS = [
  "Reading the thread…",
  "Weighing it against your interests…",
  "Picking the comments worth your time…",
];

/** Animated placeholder with a spinner and rotating status copy. */
function LoadingCard() {
  const [step, setStep] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      ref.current = Math.min(ref.current + 1, LOADING_STEPS.length - 1);
      setStep(ref.current);
    }, 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="card flex items-center gap-3 p-4 text-sm text-[color:var(--color-fg-muted)]">
      <span className="text-[color:var(--color-accent)]">
        <Spinner className="size-4" />
      </span>
      {LOADING_STEPS[step]}
    </div>
  );
}

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
          ✨ {state.s === "error" ? "Try AI digest again" : "AI digest"}
        </button>
        {state.s === "error" && (
          <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-2.5 text-xs leading-relaxed text-[color:var(--color-fg-muted)]">
            {state.msg}
          </div>
        )}
      </div>
    );
  }

  if (state.s === "loading") return <LoadingCard />;

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
