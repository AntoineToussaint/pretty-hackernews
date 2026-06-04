import { useEffect, useState } from "react";
import { DEFAULT_MODELS, type Provider } from "../lib/llm";
import {
  loadAiSettings,
  saveAiSettings,
  suggestTags,
} from "../sources/hn/aiDigest";

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 py-2 text-sm text-[color:var(--color-fg)] outline-none transition placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-accent)]";
const labelCls =
  "mb-1.5 mt-5 block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-muted)]";

/**
 * The bring-your-own-key AI + profile form. Self-loads and self-saves to
 * extension storage, so it can be dropped into the in-reader settings modal or
 * the standalone options page unchanged.
 */
export function AiProfileForm() {
  const [provider, setProvider] = useState<Provider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [profile, setProfile] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [suggestErr, setSuggestErr] = useState("");

  useEffect(() => {
    loadAiSettings().then((s) => {
      setProvider(s.provider);
      setApiKey(s.apiKey);
      setModel(s.model);
      setProfile(s.profile);
      setTags(s.interests);
    });
  }, []);

  const current = (): import("../sources/hn/aiDigest").AiSettings => ({
    provider,
    apiKey,
    model,
    profile,
    interests: tags,
  });

  const addTag = (t: string) => {
    const tag = t.trim();
    if (!tag) return;
    setTags((cur) => (cur.includes(tag) ? cur : [...cur, tag]));
    setSuggested((s) => s.filter((x) => x !== tag));
  };
  const removeTag = (t: string) =>
    setTags((cur) => cur.filter((x) => x !== t));
  const commitInput = () => {
    tagInput.split(",").forEach(addTag);
    setTagInput("");
  };

  const suggest = async () => {
    setSuggestErr("");
    setSuggesting(true);
    await saveAiSettings(current()); // key must be stored before the LLM call
    const res = await suggestTags(profile);
    setSuggesting(false);
    if (res.ok) setSuggested(res.tags);
    else setSuggestErr(res.error);
  };

  const save = async () => {
    await saveAiSettings(current());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const freshSuggested = suggested.filter((t) => !tags.includes(t));

  return (
    <div>
      <label className={labelCls + " mt-0"}>Provider</label>
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

      <label className={labelCls}>API key</label>
      <input
        className={inputCls}
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={provider === "claude" ? "sk-ant-…" : "sk-…"}
      />

      <label className={labelCls}>Model</label>
      <input
        className={inputCls}
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder={DEFAULT_MODELS[provider]}
      />
      <p className="mt-1.5 text-xs text-[color:var(--color-fg-muted)]">
        Leave blank for the default ({DEFAULT_MODELS[provider]} — cheap). Bump to
        claude-opus-4-8 for deeper digests.
      </p>

      <label className={labelCls}>About you</label>
      <textarea
        className={inputCls + " min-h-28 resize-y"}
        value={profile}
        onChange={(e) => setProfile(e.target.value)}
        placeholder="A few sentences about who you are and what you care about. Tip: paste your LinkedIn 'About' / experience here — it's used to judge what's interesting to you and to suggest tags."
      />

      <label className={labelCls}>Interests</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-2 transition focus-within:border-[color:var(--color-accent)]">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-bg)] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[color:var(--color-fg)] ring-1 ring-[color:var(--color-border)]"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`Remove ${t}`}
              className="grid size-4 place-items-center rounded-full text-[color:var(--color-fg-muted)] transition hover:bg-[color:var(--color-accent)] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-[color:var(--color-fg)] outline-none placeholder:text-[color:var(--color-fg-muted)]"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitInput();
            } else if (e.key === "Backspace" && !tagInput && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          onBlur={commitInput}
          placeholder={
            tags.length ? "Add another…" : "rust, distributed systems, startups…"
          }
        />
      </div>

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
        {freshSuggested.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {freshSuggested.map((t) => (
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
          <span className="text-sm text-[color:var(--color-fg-muted)]">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
