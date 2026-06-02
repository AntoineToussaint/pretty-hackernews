import type { CommentNode, StoryItem } from "./api";
import { hostname } from "../../lib/format";

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
    local?: { get: (keys: string[], cb: (items: Record<string, unknown>) => void) => void };
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

function parseDigest(text: string): Digest | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const d = JSON.parse(m[0]);
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
  } catch {
    return null;
  }
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
  const m = (res.text ?? "").match(/\{[\s\S]*\}/);
  if (!m) return { ok: false, error: "Couldn't parse the AI response." };
  try {
    const d = JSON.parse(m[0]);
    const tags = Array.isArray(d.tags)
      ? d.tags
          .map((t: unknown) => String(t).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 20)
      : [];
    return { ok: true, tags };
  } catch {
    return { ok: false, error: "Couldn't parse the AI response." };
  }
}

export async function digestStory(
  story: StoryItem,
): Promise<{ ok: true; digest: Digest } | { ok: false; error: string }> {
  const { profile, interests } = await getProfile();
  const { system, user } = buildPrompt(story, profile, interests);
  const res = await send<{ ok: boolean; text?: string; error?: string }>({
    type: "hatch-llm",
    system,
    user,
    maxTokens: 1200,
  });
  if (!res) return { ok: false, error: "No response from the extension." };
  if (!res.ok) {
    return {
      ok: false,
      error:
        res.error === "not-configured"
          ? "Add your API key in the Hatch settings (toolbar icon → AI & profile settings)."
          : res.error || "AI request failed.",
    };
  }
  const digest = parseDigest(res.text ?? "");
  return digest
    ? { ok: true, digest }
    : { ok: false, error: "Couldn't parse the AI response." };
}
