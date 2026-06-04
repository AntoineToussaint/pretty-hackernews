import { complete, type Provider } from "./lib/llm";

// Network-layer header rules, installed via declarativeNetRequest.
const CSP_RULE_ID = 1;
const ANTHROPIC_ORIGIN_RULE_ID = 2;

async function installRules() {
  try {
    // Dynamic rule: strip HN's Content-Security-Policy on its own pages so our
    // in-place reader can load external images (favicons, article hero images)
    // and the Inter font — all of which HN's `img-src 'self'` would block. This
    // necessarily targets HN's top-level navigation (a real tab request).
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
            urlFilter: "||news.ycombinator.com",
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

  // Run an LLM completion using the stored config. The key stays here.
  if (msg?.type === "hatch-llm") {
    chrome.storage.local.get(["aiProvider", "aiKey", "aiModel"], (r) => {
      if (!r.aiKey) {
        sendResponse({ ok: false, error: "not-configured" });
        return;
      }
      complete(
        {
          provider: (r.aiProvider as Provider) || "claude",
          apiKey: r.aiKey as string,
          model: (r.aiModel as string) || "",
        },
        msg.system,
        msg.user,
        msg.maxTokens || 1024,
      ).then(sendResponse);
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(installRules);
chrome.runtime.onStartup.addListener(installRules);
// Also run when the service worker spins up (dynamic rules persist, so this is
// idempotent thanks to removeRuleIds).
installRules();
