import "./compiled.css";
import { useEffect, useState } from "react";
import { DEFAULT_MODELS, type Provider } from "./lib/llm";
import { suggestTags } from "./sources/hn/aiDigest";

const input =
  "w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 py-2 text-sm text-[color:var(--color-fg)] outline-none transition placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-accent)]";
const label =
  "mb-1.5 mt-5 block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]";

export default function Options() {
  const [provider, setProvider] = useState<Provider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [profile, setProfile] = useState("");
  const [interests, setInterests] = useState("");
  const [saved, setSaved] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [suggestErr, setSuggestErr] = useState("");

  useEffect(() => {
    chrome.storage.local.get(
      ["aiProvider", "aiKey", "aiModel", "aiProfile", "aiInterests", "theme"],
      (r) => {
        if (r.aiProvider) setProvider(r.aiProvider);
        if (r.aiKey) setApiKey(r.aiKey);
        if (r.aiModel) setModel(r.aiModel);
        if (r.aiProfile) setProfile(r.aiProfile);
        if (Array.isArray(r.aiInterests)) setInterests(r.aiInterests.join(", "));
        document.documentElement.classList.add(
          `theme-${typeof r.theme === "string" ? r.theme : "classic"}`,
        );
      },
    );
  }, []);

  const addTag = (t: string) => {
    const cur = interests.split(",").map((s) => s.trim()).filter(Boolean);
    if (!cur.includes(t)) setInterests([...cur, t].join(", "));
    setSuggested((s) => s.filter((x) => x !== t));
  };

  const persistKey = () =>
    new Promise<void>((r) =>
      chrome.storage.local.set(
        {
          aiProvider: provider,
          aiKey: apiKey.trim(),
          aiModel: model.trim() || DEFAULT_MODELS[provider],
        },
        () => r(),
      ),
    );

  const suggest = async () => {
    setSuggestErr("");
    setSuggesting(true);
    await persistKey();
    const res = await suggestTags(profile);
    setSuggesting(false);
    if (res.ok) setSuggested(res.tags);
    else setSuggestErr(res.error);
  };

  const save = () => {
    chrome.storage.local.set(
      {
        aiProvider: provider,
        aiKey: apiKey.trim(),
        aiModel: model.trim() || DEFAULT_MODELS[provider],
        aiProfile: profile.trim(),
        aiInterests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      },
      () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    );
  };

  return (
    <div className="min-h-screen px-5 py-10 text-[color:var(--color-fg)]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold tracking-tight">
          Hatch — AI &amp; profile
        </h1>
        <p className="mt-1.5 text-sm text-[color:var(--color-fg-muted)]">
          Bring your own key. It's stored only in this browser and used to call
          the provider directly — nothing goes to any other server.
        </p>

        <div className="card mt-6 p-5">
          <label className={label + " mt-0"}>Provider</label>
          <div className="flex gap-2">
            {(["claude", "openai"] as Provider[]).map((p) => {
              const active = provider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={
                    "flex-1 rounded-lg py-2 text-sm font-semibold transition " +
                    (active
                      ? "accent-bg text-white"
                      : "ring-1 ring-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]")
                  }
                >
                  {p === "claude" ? "Claude (Anthropic)" : "OpenAI"}
                </button>
              );
            })}
          </div>

          <label className={label}>API key</label>
          <input
            className={input}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === "claude" ? "sk-ant-…" : "sk-…"}
          />

          <label className={label}>Model</label>
          <input
            className={input}
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
          />
          <p className="mt-1.5 text-xs text-[color:var(--color-fg-muted)]">
            Leave blank for the default ({DEFAULT_MODELS[provider]} — cheap).
            Bump to claude-opus-4-8 for deeper digests.
          </p>

          <label className={label}>About you</label>
          <textarea
            className={input + " min-h-28 resize-y"}
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="A few sentences about who you are and what you care about. Tip: paste your LinkedIn 'About' / experience here — it's used to judge what's interesting to you and to suggest tags."
          />

          <label className={label}>Interests</label>
          <input
            className={input}
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="rust, distributed systems, startups, type theory, climate"
          />
          <div className="mt-2.5">
            <button
              type="button"
              onClick={suggest}
              disabled={suggesting || !profile.trim()}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[color:var(--color-fg)] ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-bg-elev)] disabled:opacity-50"
            >
              {suggesting ? "Thinking…" : "✨ Suggest tags from my description"}
            </button>
            {suggestErr && (
              <p className="mt-1.5 text-xs text-[color:var(--color-fg-muted)]">
                {suggestErr}
              </p>
            )}
            {suggested.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {suggested.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="rounded-full bg-[color:var(--color-bg-elev)] px-2.5 py-1 text-xs text-[color:var(--color-fg-muted)] ring-1 ring-[color:var(--color-border)] transition hover:text-[color:var(--color-fg)]"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              className="accent-bg rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Save
            </button>
            {saved && (
              <span className="text-sm text-[color:var(--color-fg-muted)]">
                Saved ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
