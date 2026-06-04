// Thin provider layer over Anthropic + OpenAI. Runs in the background worker
// (cross-origin fetches must live there under MV3). The API key never leaves
// the browser — it's read from chrome.storage by the background and used here.

export type Provider = "claude" | "openai";

export type LLMConfig = {
  provider: Provider;
  apiKey: string;
  model: string;
};

export type LLMUsage = { input: number; output: number };
export type LLMResult =
  | { ok: true; text: string; usage?: LLMUsage }
  | { ok: false; error: string };

// Cheap-by-default for cost control — digests/tagging work well on small models.
// Bump to a bigger model (e.g. claude-opus-4-8) in settings for deeper digests.
export const DEFAULT_MODELS: Record<Provider, string> = {
  claude: "claude-haiku-4-5",
  openai: "gpt-4o-mini",
};

// Curated picks for the settings dropdown (first = the cheap default). Users can
// still enter any model id via the "Custom…" option.
export const MODEL_OPTIONS: Record<Provider, { id: string; label: string }[]> = {
  claude: [
    { id: "claude-haiku-4-5", label: "Haiku 4.5 — fast & cheap (default)" },
    { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — balanced" },
    { id: "claude-opus-4-8", label: "Opus 4.8 — deepest, priciest" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini — fast & cheap (default)" },
    { id: "gpt-4o", label: "GPT-4o — balanced" },
  ],
};

export async function complete(
  cfg: LLMConfig,
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<LLMResult> {
  try {
    if (cfg.provider === "claude") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": cfg.apiKey,
          "anthropic-version": "2023-06-01",
          // NB: we deliberately do NOT send
          // `anthropic-dangerous-direct-browser-access`. That header opts into
          // Anthropic's browser/CORS path, which orgs with custom data-retention
          // (zero-retention) settings reject with a 401. This fetch runs in the
          // MV3 background service worker with api.anthropic.com in
          // host_permissions, so Chrome doesn't enforce CORS and the header is
          // unnecessary — omitting it lets ZDR-org keys work.
        },
        body: JSON.stringify({
          model: cfg.model || DEFAULT_MODELS.claude,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) {
        return { ok: false, error: `Anthropic ${res.status}: ${await res.text()}` };
      }
      const data = await res.json();
      const text = (data.content ?? [])
        .filter((b: { type?: string }) => b.type === "text")
        .map((b: { text?: string }) => b.text ?? "")
        .join("");
      const usage = data.usage
        ? { input: data.usage.input_tokens ?? 0, output: data.usage.output_tokens ?? 0 }
        : undefined;
      return { ok: true, text, usage };
    }

    // OpenAI
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model || DEFAULT_MODELS.openai,
        max_completion_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `OpenAI ${res.status}: ${await res.text()}` };
    }
    const data = await res.json();
    const usage = data.usage
      ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0 }
      : undefined;
    return { ok: true, text: data.choices?.[0]?.message?.content ?? "", usage };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// USD per 1M tokens (input / output). Used to estimate spend for the daily
// budget and the usage readout. Unknown models fall back to a conservative
// estimate so the budget still protects you.
export const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-opus-4-7": { in: 5, out: 25 },
  "claude-opus-4-6": { in: 5, out: 25 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
};

/** Estimated USD cost of one call, from the model and its token usage. */
export function costFor(model: string, usage: LLMUsage): number {
  const p = PRICING[model] ?? { in: 3, out: 15 };
  return (usage.input / 1e6) * p.in + (usage.output / 1e6) * p.out;
}
