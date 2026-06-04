import { useEffect, useRef, useState } from "react";
import { hasPreviewPermission, loadArticle, type Article } from "./article";

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
  const contentRef = useRef<HTMLDivElement>(null);
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
