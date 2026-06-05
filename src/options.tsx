import "./compiled.css";
import { useEffect } from "react";
import { AiProfileForm } from "./components/AiProfileForm";

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
          Pretty Hacker News — AI &amp; profile
        </h1>
        <p className="mt-1.5 text-sm text-[color:var(--color-fg-muted)]">
          Bring your own key. It's stored only in this browser and used to call
          the provider directly — nothing goes to any other server. You can also
          reach these settings from the gear inside the reader on
          news.ycombinator.com.
        </p>

        <div className="card mt-6 p-5">
          <AiProfileForm />
        </div>
      </div>
    </div>
  );
}
