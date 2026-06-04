import { useEffect, useRef, useState } from "react";
import { hasPreviewPermission, loadArticle, type Article } from "./article";
import {
  aiConfigured,
  summarizeArticle,
  type ArticleSummary,
} from "./aiDigest";

type SummaryState =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "error"; msg: string }
  | { s: "ready"; data: ArticleSummary };

function MiniSpinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type State =
  | { status: "loading" }
  | { status: "needs-permission" }
  | { status: "error" }
  | { status: "ready"; article: Article };

export function ArticlePeek({
  url,
  variant = "inline",
}: {
  url: string;
  /** "inline" sits under a story card (top divider); "card" is a standalone box. */
  variant?: "inline" | "card";
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [full, setFull] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [aiOn, setAiOn] = useState(false);
  const [summary, setSummary] = useState<SummaryState>({ s: "idle" });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiConfigured().then(setAiOn);
  }, []);

  const runSummary = async (article: Article) => {
    setSummary({ s: "loading" });
    const res = await summarizeArticle(article.title ?? "", article.html);
    setSummary(res.ok ? { s: "ready", data: res.summary } : { s: "error", msg: res.error });
  };
  const wrap =
    variant === "card"
      ? "card p-4 sm:p-5"
      : "mt-3 border-t border-[color:var(--color-border)] pt-3";

  // Recover lazy-loaded images and hide ones that fail — many sites use
  // data-src placeholders or block hotlinking, which otherwise leaves
  // broken-image boxes. Runs whenever the article content is rendered.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.querySelectorAll("img").forEach((img) => {
      const lazy =
        img.getAttribute("data-src") ||
        img.getAttribute("data-original") ||
        img.getAttribute("data-lazy-src");
      const src = img.getAttribute("src");
      if (lazy && (!src || src.startsWith("data:"))) img.src = lazy;
      const hide = () => {
        img.style.display = "none";
      };
      if (img.complete && img.naturalWidth === 0) hide();
      img.addEventListener("error", hide, { once: true });
    });
  }, [full, state]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setFull(false);
    setImgOk(true);
    setSummary({ s: "idle" });
    hasPreviewPermission().then((granted) => {
      if (cancelled) return;
      if (!granted) {
        setState({ status: "needs-permission" });
        return;
      }
      loadArticle(url).then((article) => {
        if (cancelled) return;
        setState(article ? { status: "ready", article } : { status: "error" });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.status === "needs-permission") {
    return (
      <div className={wrap + " text-sm text-[color:var(--color-fg-muted)]"}>
        Turn on <span className="text-[color:var(--color-fg)]">Article previews</span>{" "}
        in the Hatch toolbar icon to read pages inline.{" "}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-accent)] underline-offset-2 hover:underline"
        >
          Open it ↗
        </a>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className={wrap + " text-sm text-[color:var(--color-fg-muted)]"}>
        Loading preview…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={wrap + " text-sm text-[color:var(--color-fg-muted)]"}>
        Couldn't load a preview for this page.{" "}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-accent)] underline-offset-2 hover:underline"
        >
          Open it ↗
        </a>
      </div>
    );
  }

  const { article } = state;
  return (
    <div className={wrap}>
      {aiOn && (
        <div className="mb-3">
          {summary.s === "idle" && (
            <button
              type="button"
              onClick={() => runSummary(article)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[color:var(--color-fg)] ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg-elev)]"
            >
              ✨ Summarize article
            </button>
          )}
          {summary.s === "loading" && (
            <div className="flex items-center gap-2 text-sm text-[color:var(--color-fg-muted)]">
              <span className="text-[color:var(--color-accent)]">
                <MiniSpinner />
              </span>
              Summarizing…
            </div>
          )}
          {summary.s === "error" && (
            <div className="text-xs text-[color:var(--color-fg-muted)]">
              {summary.msg}{" "}
              <button
                type="button"
                onClick={() => runSummary(article)}
                className="text-[color:var(--color-accent)] hover:underline"
              >
                Retry
              </button>
            </div>
          )}
          {summary.s === "ready" && (
            <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]/50 p-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-fg-muted)]">
                ✨ Summary
              </div>
              {summary.data.thesis && (
                <p className="text-sm font-medium leading-relaxed">
                  {summary.data.thesis}
                </p>
              )}
              {summary.data.bullets.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--color-fg-muted)]">
                  {summary.data.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      {article.image && imgOk && (
        <img
          src={article.image}
          alt=""
          loading="lazy"
          onError={() => setImgOk(false)}
          className="mb-3 h-44 w-full rounded-lg object-cover"
        />
      )}
      <div
        ref={contentRef}
        className={
          "comment-body text-[14.5px] leading-relaxed [&_img]:my-2 [&_img]:rounded-lg [&_img]:max-h-80 [&_img]:w-auto " +
          (full ? "" : "max-h-80 overflow-y-auto pr-1")
        }
        dangerouslySetInnerHTML={{ __html: article.html }}
      />
      <div className="mt-3 flex items-center gap-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setFull((f) => !f)}
          className="text-[color:var(--color-accent)] hover:underline"
        >
          {full ? "Show less" : "Read full"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)]"
        >
          Open original ↗
        </a>
      </div>
    </div>
  );
}
