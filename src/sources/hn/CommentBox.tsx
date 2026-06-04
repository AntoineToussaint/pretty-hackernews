import { useEffect, useRef, useState } from "react";
import { postComment, type CommentForm } from "./auth";

type Status = "idle" | "posting" | "done" | "error";

/**
 * Comment composer for any parent (a story for a top-level comment, or a comment
 * for a reply). `getForm` fetches the right HN form token. Renders nothing
 * outside the extension; prompts login when logged out, posts same-origin.
 */
export function CommentBox({
  parentId,
  getForm,
  onPosted,
  autoFocus = false,
  placeholder = "Add a comment…",
}: {
  parentId: string;
  getForm: () => Promise<CommentForm | null>;
  onPosted: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [form, setForm] = useState<CommentForm | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    setForm(null);
    setText("");
    setStatus("idle");
    getForm().then((f) => {
      if (!cancelled) setForm(f);
    });
    return () => {
      cancelled = true;
    };
    // getForm identity is stable per parent in practice; key on parentId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  useEffect(() => {
    if (autoFocus && form?.hmac) taRef.current?.focus();
  }, [autoFocus, form]);

  if (!form) return null; // not in the extension, or still loading

  if (!form.loggedIn || !form.hmac) {
    return (
      <a
        href={`https://news.ycombinator.com/login?goto=item%3Fid%3D${parentId}`}
        target="_blank"
        rel="noreferrer"
        className="card block p-4 text-center text-sm text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)]"
      >
        Log in to HN to comment →
      </a>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || status === "posting") return;
    setStatus("posting");
    const ok = await postComment(parentId, text, form.hmac);
    if (ok) {
      setText("");
      setStatus("done");
      onPosted();
    } else {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={submit} className="card p-3 sm:p-4">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-lg border border-[color:var(--color-fg-muted)]/35 bg-[color:var(--color-bg)] p-2.5 text-sm text-[color:var(--color-fg)] outline-none transition placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-accent)]"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[color:var(--color-fg-muted)]">
          {status === "error"
            ? "Couldn't post — try again"
            : status === "done"
              ? "Posted ✓"
              : ""}
        </span>
        <button
          type="submit"
          disabled={!text.trim() || status === "posting"}
          className="accent-bg rounded-full px-4 py-1.5 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {status === "posting" ? "Posting…" : "Add comment"}
        </button>
      </div>
    </form>
  );
}
