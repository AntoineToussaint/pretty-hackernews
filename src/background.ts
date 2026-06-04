import {
  complete,
  costFor,
  DEFAULT_MODELS,
  type LLMResult,
  type Provider,
} from "./lib/llm";

type AiUsage = {
  date: string; // YYYY-MM-DD (local)
  requests: number;
  input: number;
  output: number;
  cost: number; // estimated USD
};

// Network-layer header rules, installed via declarativeNetRequest.
const CSP_RULE_ID = 1;
const ANTHROPIC_ORIGIN_RULE_ID = 2;

async function installRules() {
  try {
    // Dynamic rule: strip HN's Content-Security-Policy on the pages we skin so
    // our reader can load its bundled font (a chrome-extension: URL) and article
    // preview images — both of which HN's `font-src/img-src 'self'` would block.
    // This necessarily targets HN's top-level navigation (a real tab request).
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [CSP_RULE_ID, ANTHROPIC_ORIGIN_RULE_ID],
      addRules: [
        {
          id: CSP_RULE_ID,
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              { header: "content-security-policy", operation: "remove" },
              { header: "content-security-policy-report-only", operation: "remove" },
            ],
          },
          condition: {
            // Only the pages our reader actually renders — NOT /login, /submit,
            // /user, /reply etc., so HN keeps its CSP where we don't skin.
            regexFilter:
              "^https://news\\.ycombinator\\.com/(?:$|\\?|news|newest|best|ask|show|jobs|item)",
            resourceTypes: ["main_frame", "sub_frame"],
          },
        },
      ],
    });

    // Session rule: strip the `Origin` header on OUR calls to the Anthropic
    // API. Chrome attaches `Origin: chrome-extension://…` to background fetches,
    // which makes Anthropic treat them as browser/CORS requests — and orgs with
    // zero-data-retention settings reject those with a 401. Removing Origin
    // makes it a plain server-side request, so ZDR-org keys work.
    //
    // `tabIds: [-1]` restricts this to requests not associated with any tab —
    // i.e. the extension's own service-worker fetches — so it can NEVER touch a
    // real web page's calls to api.anthropic.com (tabIds is session-only). This
    // is why the rule lives in session rules, not dynamic rules.
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ANTHROPIC_ORIGIN_RULE_ID],
      addRules: [
        {
          id: ANTHROPIC_ORIGIN_RULE_ID,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [{ header: "origin", operation: "remove" }],
          },
          condition: {
            urlFilter: "||api.anthropic.com",
            resourceTypes: ["xmlhttprequest"],
            tabIds: [-1],
          },
        },
      ],
    });
  } catch (e) {
    console.error("[hatch] failed to install header rules", e);
  }
}

// Fetch an article's HTML for the inline preview. Cross-origin fetches must run
// here (the service worker), not the content script — MV3 subjects content-script
// fetches to CORS even with host permissions.
const PREVIEW_ORIGINS = ["*://*/*"];

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "hatch-fetch-article" && typeof msg.url === "string") {
    // No cookies are sent, and the cross-origin fetch only succeeds when the
    // user has granted the optional host permission — so this can't leak the
    // session or act as an open proxy without consent.
    fetch(msg.url, { credentials: "omit" })
      .then((r) => r.text())
      .then((html) => sendResponse({ ok: true, html }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // keep the channel open for the async response
  }
  // Content scripts can't read chrome.permissions, so they ask us.
  if (msg?.type === "hatch-has-preview-permission") {
    chrome.permissions.contains({ origins: PREVIEW_ORIGINS }, (granted) =>
      sendResponse({ granted }),
    );
    return true;
  }

  // Is the AI configured? (key kept in the background; not exposed to content.)
  if (msg?.type === "hatch-ai-status") {
    chrome.storage.local.get(["aiKey"], (r) =>
      sendResponse({ configured: !!r.aiKey }),
    );
    return true;
  }

  // Run an LLM completion using the stored config. Serialized through a queue so
  // the read-check-write of daily usage is atomic (no lost updates / overspend
  // when two requests fire at once). The key stays in this worker.
  if (msg?.type === "hatch-llm") {
    const job = aiQueue.then(() => runLlm(msg));
    aiQueue = job.catch(() => {});
    job.then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});

const getLocal = (keys: string[]) =>
  new Promise<Record<string, unknown>>((r) => chrome.storage.local.get(keys, r));
const setLocal = (items: Record<string, unknown>) =>
  new Promise<void>((r) => chrome.storage.local.set(items, () => r()));

// Serializes AI calls so usage accounting can't race.
let aiQueue: Promise<unknown> = Promise.resolve();

async function runLlm(msg: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<LLMResult> {
  const cfg = await getLocal([
    "aiProvider",
    "aiKey",
    "aiModel",
    "aiDailyBudget",
    "aiUsage",
  ]);
  if (!cfg.aiKey) return { ok: false, error: "not-configured" };

  const provider = (cfg.aiProvider as Provider) || "claude";
  const model = (cfg.aiModel as string) || DEFAULT_MODELS[provider];
  const budget = Number(cfg.aiDailyBudget) || 0; // USD/day; 0 = unlimited
  const today = new Date().toISOString().slice(0, 10);
  const prev = cfg.aiUsage as AiUsage | undefined;
  const usage: AiUsage =
    prev && prev.date === today
      ? prev
      : { date: today, requests: 0, input: 0, output: 0, cost: 0 };

  if (budget > 0 && usage.cost >= budget) return { ok: false, error: "daily-limit" };

  const res = await complete(
    { provider, apiKey: cfg.aiKey as string, model },
    msg.system,
    msg.user,
    msg.maxTokens || 1024,
  );

  // Count every successful call (even if the provider omitted a usage block);
  // add estimated cost only when usage is reported.
  if (res.ok) {
    const u = res.usage ?? { input: 0, output: 0 };
    await setLocal({
      aiUsage: {
        date: today,
        requests: usage.requests + 1,
        input: usage.input + u.input,
        output: usage.output + u.output,
        cost: usage.cost + (res.usage ? costFor(model, res.usage) : 0),
      } satisfies AiUsage,
    });
  }
  return res;
}

chrome.runtime.onInstalled.addListener(installRules);
chrome.runtime.onStartup.addListener(installRules);
// Also run when the service worker spins up (dynamic rules persist, so this is
// idempotent thanks to removeRuleIds).
installRules();
