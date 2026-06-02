import { useEffect, useState } from "react";
import { isExtension } from "../../lib/runtime";
import { fetchAuthState, LOGIN_URL, type AuthState } from "./auth";

/**
 * Header chip showing HN login state. Only rendered in the extension — on the
 * web build there's no way to read HN's cookie, so it renders nothing.
 */
export function AccountStatus() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    if (!isExtension()) return;
    let cancelled = false;
    fetchAuthState()
      .then((s) => {
        if (!cancelled) setState(s);
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isExtension() || state.status === "loading") return null;

  if (state.status === "logged-in") {
    return (
      <span
        className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-[color:var(--color-bg-elev)]/70 px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-fg)] ring-1 ring-[color:var(--color-border)] sm:inline-flex"
        title={`Logged in to HN as ${state.username}`}
      >
        <span className="size-1.5 rounded-full bg-emerald-400" />
        {state.username}
      </span>
    );
  }

  return (
    <a
      href={LOGIN_URL}
      target="_blank"
      rel="noreferrer"
      className="shrink-0 whitespace-nowrap rounded-xl bg-[color:var(--color-bg-elev)]/70 px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)]"
    >
      Log in to HN
    </a>
  );
}
