import type { CommentNode, StoryItem } from "./api";
import { hostname } from "../../lib/format";
import { DEFAULT_MODELS, type Provider } from "../../lib/llm";

export type AiSettings = {
  provider: Provider;
  apiKey: string;
  model: string;
  profile: string;
  interests: string[];
};

const EMPTY_SETTINGS: AiSettings = {
  provider: "claude",
  apiKey: "",
  model: "",
  profile: "",
  interests: [],
};

/** Read the saved AI/profile settings from extension storage. */
export function loadAiSettings(): Promise<AiSettings> {
  return new Promise((resolve) => {
    const local = chromeApi?.storage?.local;
    if (!local) return resolve(EMPTY_SETTINGS);
    local.get(
      ["aiProvider", "aiKey", "aiModel", "aiProfile", "aiInterests"],
      (r) =>
        resolve({
          provider: r.aiProvider === "openai" ? "openai" : "claude",
          apiKey: typeof r.aiKey === "string" ? r.aiKey : "",
          model: typeof r.aiModel === "string" ? r.aiModel : "",
          profile: typeof r.aiProfile === "string" ? r.aiProfile : "",
          interests: Array.isArray(r.aiInterests) ? (r.aiInterests as string[]) : [],
        }),
    );
  });
}

/** Persist AI/profile settings; falls back to the provider's default model. */
export function saveAiSettings(s: AiSettings): Promise<void> {
  return new Promise((resolve) => {
    const local = chromeApi?.storage?.local;
    if (!local) return resolve();
    local.set(
      {
        aiProvider: s.provider,
        aiKey: s.apiKey.trim(),
        aiModel: s.model.trim() || DEFAULT_MODELS[s.provider],
        aiProfile: s.profile.trim(),
        aiInterests: s.interests,
      },
      () => resolve(),
    );
  });
}

export type DigestPick = {
  author: string;
  why: string;
  action: "read" | "reply";
};
export type Digest = {
  verdict: string;
  worth: "yes" | "maybe" | "no";
  picks: DigestPick[];
};

type ChromeLike = {
  runtime?: {
    sendMessage: (msg: unknown, cb: (res?: unknown) => void) => void;
    lastError?: unknown;
  };
  storage?: {
    local?: {
      get: (keys: string[], cb: (items: Record<string, unknown>) => void) => void;
      set: (items: Record<string, unknown>, cb?: () => void) => void;
    };
  };
};
const chromeApi = (globalThis as unknown as { chrome?: ChromeLike }).chrome;

function send<T>(msg: unknown): Promise<T | null> {
  const runtime = chromeApi?.runtime;
  if (!runtime) return Promise.resolve(null);
  return new Promise((resolve) => {
    runtime.sendMessage(msg, (res) => {
      resolve(runtime.lastError ? null : (res as T));
    });
  });
}

/** Is an AI provider + key configured? */
export async function aiConfigured(): Promise<boolean> {
  const res = await send<{ configured?: boolean }>({ type: "hatch-ai-status" });
  return !!res?.configured;
}

function getProfile(): Promise<{ profile: string; interests: string[] }> {
  return new Promise((resolve) => {
    const local = chromeApi?.storage?.local;
    if (!local) return resolve({ profile: "", interests: [] });
    local.get(["aiProfile", "aiInterests"], (r) => {
      resolve({
        profile: typeof r.aiProfile === "string" ? r.aiProfile : "",
        interests: Array.isArray(r.aiInterests) ? (r.aiInterests as string[]) : [],
      });
    });
  });
}

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim();

function flatten(nodes: CommentNode[], out: string[], cap: number) {
  for (const n of nodes) {
    if (out.length >= cap) return;
    if (n.author && n.text) out.push(`${n.author}: ${strip(n.text).slice(0, 400)}`);
    flatten(n.children, out, cap);
  }
}

function buildPrompt(
  story: StoryItem,
  profile: string,
  interests: string[],
): { system: string; user: string } {
  const system =
    "You triage Hacker News for one specific reader. " +
    `Reader profile: ${profile || "(none given)"}. ` +
    `Stated interests: ${interests.join(", ") || "(none given)"}. ` +
    "Given a post and its comments, judge whether it's worth THIS reader's time and pick the few most valuable comments for them to read, plus any they're well-placed to reply to. " +
    'Respond with ONLY minified JSON, no markdown fences: {"verdict": "<=1 sentence", "worth": "yes"|"maybe"|"no", "picks": [{"author": string, "why": "<=1 sentence", "action": "read"|"reply"}]}. ' +
    "Pick at most 5. If no comments are worth it, return an empty picks array.";

  const comments: string[] = [];
  flatten(story.children, comments, 30);
  const host = hostname(story.url);
  const user =
    `POST: ${story.title}${host ? ` (${host})` : ""}\n` +
    (story.text ? `POST TEXT: ${strip(story.text).slice(0, 1500)}\n` : "") +
    `\nCOMMENTS (${comments.length} shown):\n` +
    comments.join("\n");
  return { system, user };
}

// Models often wrap JSON in prose or ```fences; grab the outermost object.
function parseJsonObject(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseDigest(text: string): Digest | null {
  const d = parseJsonObject(text);
  if (!d) return null;
  return {
    verdict: String(d.verdict ?? ""),
    worth: d.worth === "yes" || d.worth === "no" ? d.worth : "maybe",
    picks: Array.isArray(d.picks)
      ? d.picks.slice(0, 5).map((p: Record<string, unknown>) => ({
          author: String(p.author ?? ""),
          why: String(p.why ?? ""),
          action: p.action === "reply" ? "reply" : "read",
        }))
      : [],
  };
}

/** Propose interest tags from a free-text description (or pasted bio/LinkedIn). */
export async function suggestTags(
  text: string,
): Promise<{ ok: true; tags: string[] } | { ok: false; error: string }> {
  if (!text.trim()) return { ok: false, error: "Write a short description first." };
  const system =
    "You propose interest tags for a Hacker News reader from a description of them. " +
    'Output ONLY minified JSON: {"tags": string[]}. ' +
    '10-15 short, lowercase, specific topic tags (e.g. "rust", "distributed systems", "startups", "type theory"). ' +
    "No sentences, no duplicates, no hashtags.";
  const res = await send<{ ok: boolean; text?: string; error?: string }>({
    type: "hatch-llm",
    system,
    user: text,
    maxTokens: 400,
  });
  if (!res) return { ok: false, error: "No response from the extension." };
  if (!res.ok) {
    return {
      ok: false,
      error:
        res.error === "not-configured"
          ? "Save your API key first, then suggest tags."
          : res.error || "AI request failed.",
    };
  }
  const d = parseJsonObject(res.text ?? "");
  if (!d) return { ok: false, error: "Couldn't parse the AI response." };
  const tags = Array.isArray(d.tags)
    ? d.tags
        .map((t: unknown) => String(t).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  return { ok: true, tags };
}

export async function digestStory(
  story: StoryItem,
): Promise<{ ok: true; digest: Digest } | { ok: false; error: string }> {
  try {
    const { profile, interests } = await getProfile();
    const { system, user } = buildPrompt(story, profile, interests);
    const res = await send<{ ok: boolean; text?: string; error?: string }>({
      type: "hatch-llm",
      system,
      user,
      maxTokens: 1500,
    });
    if (!res) return { ok: false, error: "No response from the extension." };
    if (!res.ok) {
      return {
        ok: false,
        error:
          res.error === "not-configured"
            ? "Add your API key in Settings (the gear, top-right)."
            : res.error || "AI request failed.",
      };
    }
    const text = res.text ?? "";
    const digest = parseDigest(text);
    if (digest) return { ok: true, digest };
    // Surface a snippet so a malformed/empty model response is diagnosable.
    const snippet = text.trim().slice(0, 200);
    return {
      ok: false,
      error: snippet
        ? `Couldn't parse the AI response: ${snippet}…`
        : "The model returned an empty response.",
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
