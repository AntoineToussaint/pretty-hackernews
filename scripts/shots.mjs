import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173/";
const OUT = "store-assets/auto";
mkdirSync(OUT, { recursive: true });

const FEED_THEMES = [
  ["classic", "feed-classic"],
  ["nord", "feed-nord"],
  ["dracula", "feed-dracula"],
  ["bloomberg", "feed-bloomberg"],
  ["matrix", "feed-matrix"],
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

async function applyTheme(theme) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => localStorage.setItem("theme", t), theme);
}

async function waitFeed() {
  // Wait for the list to actually populate (cards stream in one-by-one), not
  // just the first card, then let the entrance animation + icons settle.
  await page
    .waitForFunction(() => document.querySelectorAll("article").length >= 18, {
      timeout: 30000,
    })
    .catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2500);
}

// Warm up the feed cache once so the first themed capture isn't caught loading.
await page.goto(BASE + "#/hn/top", { waitUntil: "domcontentloaded" });
await waitFeed();

// 1) Feed in several themes.
for (const [theme, name] of FEED_THEMES) {
  await applyTheme(theme);
  await page.goto(BASE + "#/hn/top", { waitUntil: "domcontentloaded" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitFeed();
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("captured", name);
}

// 2) Story + comments (in Dracula — reads well, shows depth guides).
await applyTheme("dracula");
await page.goto(BASE + "#/hn/top", { waitUntil: "domcontentloaded" });
await page.reload({ waitUntil: "domcontentloaded" });
await waitFeed();
await page.locator("[aria-label^='Open']").first().click();
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/story-dracula.png` });
console.log("captured story-dracula");

// 3) Full theme picker (the #/settings route renders the swatch grid of all 13
//    themes, which shows off the range far better than the modal's dropdown).
await page.goto(BASE + "#/settings", { waitUntil: "domcontentloaded" });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/settings-themes.png` });
console.log("captured settings-themes");

await browser.close();
console.log("done");
