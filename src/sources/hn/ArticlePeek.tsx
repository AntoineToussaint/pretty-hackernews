import { useEffect, useState } from "react";
import { hasPreviewPermission, loadArticle, type Article } from "./article";

type State =
  | { status: "loading" }
  | { status: "needs-permission" }
  | { status: "error" }
  | { status: "ready"; article: Article };

export function ArticlePeek({ url }: { url: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [full, setFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setFull(false);
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
      <div className="mt-3 border-t border-[color:var(--color-border)] pt-3 text-sm text-[color:var(--color-fg-muted)]">
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
      <div className="mt-3 border-t border-[color:var(--color-border)] pt-3 text-sm text-[color:var(--color-fg-muted)]">
        Loading preview…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mt-3 border-t border-[color:var(--color-border)] pt-3 text-sm text-[color:var(--color-fg-muted)]">
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
    <div className="mt-3 border-t border-[color:var(--color-border)] pt-3">
      {article.image && (
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="mb-3 max-h-64 w-full rounded-lg object-cover"
        />
      )}
      {full ? (
        <div
          className="comment-body text-[14.5px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      ) : (
        article.excerpt && (
          <p className="text-[14.5px] leading-relaxed text-[color:var(--color-fg)]">
            {article.excerpt}
          </p>
        )
      )}
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
