import "./compiled.css";
import { useEffect } from "react";
import { AiProfileForm } from "./components/AiProfileForm";
import { PreviewSettingsCard } from "./components/PreviewSettingsCard";

export default function Options() {
  useEffect(() => {
    chrome.storage.local.get("theme", (r) =>
      document.documentElement.classList.add(
        `theme-${typeof r.theme === "string" ? r.theme : "classic"}`,
      ),
    );
  }, []);

  return (
    <div className="min-h-screen px-5 py-10 text-[color:var(--color-fg)]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold tracking-tight">
          Pretty Hacker News — settings
        </h1>
        <p className="mt-1.5 text-sm text-[color:var(--color-fg-muted)]">
          Stored only in this browser. You can also reach these settings from the
          gear inside the reader on news.ycombinator.com.
        </p>

        <h2 className="mt-7 text-[13px] font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
          Previews
        </h2>
        <div className="mt-2">
          <PreviewSettingsCard />
        </div>

        <h2 className="mt-7 text-[13px] font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
          AI &amp; profile
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          Bring your own key. It's used to call the provider directly — nothing
          goes to any other server.
        </p>
        <div className="card mt-3 p-5">
          <AiProfileForm />
        </div>
      </div>
    </div>
  );
}
