// Strips HN's Content-Security-Policy on its own pages so our in-place reader
// can load external images (favicons, article hero images) and the Inter web
// font — all of which HN's `img-src 'self'` / `style-src 'self'` would block.
const CSP_RULE_ID = 1;

async function installCspRule() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [CSP_RULE_ID],
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
  } catch (e) {
    console.error("[hatch] failed to install CSP rule", e);
  }
}

// Fetch an article's HTML for the inline preview. Cross-origin fetches must run
// here (the service worker), not the content script — MV3 subjects content-script
// fetches to CORS even with host permissions.
const PREVIEW_ORIGINS = ["*://*/*"];

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "hatch-fetch-article" && typeof msg.url === "string") {
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
});

chrome.runtime.onInstalled.addListener(installCspRule);
chrome.runtime.onStartup.addListener(installCspRule);
// Also run when the service worker spins up (dynamic rules persist, so this is
// idempotent thanks to removeRuleIds).
installCspRule();
