// Thin provider layer over Anthropic + OpenAI. Runs in the background worker
// (cross-origin fetches must live there under MV3). The API key never leaves
// the browser — it's read from chrome.storage by the background and used here.

export type Provider = "claude" | "openai";

export type LLMConfig = {
  provider: Provider;
  apiKey: string;
  model: string;
};

export type LLMResult = { ok: true; text: string } | { ok: false; error: string };

// Cheap-by-default for cost control — digests/tagging work well on small models.
// Bump to a bigger model (e.g. claude-opus-4-8) in settings for deeper digests.
export const DEFAULT_MODELS: Record<Provider, string> = {
  claude: "claude-haiku-4-5",
  openai: "gpt-4o-mini",
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
      return { ok: true, text };
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
    return { ok: true, text: data.choices?.[0]?.message?.content ?? "" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
