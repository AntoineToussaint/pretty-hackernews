import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("store-assets", { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 440px; height: 280px; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background:
      radial-gradient(120% 100% at 100% 0%, rgba(255,61,127,.18), transparent 55%),
      radial-gradient(120% 100% at 0% 100%, rgba(255,122,24,.16), transparent 55%),
      #0a0a0c;
    color: #f4f4f5;
    display: flex; flex-direction: column; justify-content: center;
    padding: 34px 36px; overflow: hidden;
  }
  .row { display: flex; align-items: center; gap: 14px; }
  .mark { width: 56px; height: 56px; border-radius: 15px; flex: none;
    background: linear-gradient(135deg, #ff7a18, #ff3d7f);
    box-shadow: 0 6px 20px rgba(255,80,40,.35);
    display: grid; place-items: center; }
  h1 { font-size: 30px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
  h1 .hn { color: #ff8a3d; }
  p.tag { margin-top: 18px; font-size: 15px; line-height: 1.45; color: #c7c7cf;
    max-width: 330px; }
  p.tag b { color: #f4f4f5; font-weight: 600; }
  .swatches { margin-top: 20px; display: flex; gap: 8px; align-items: center; }
  .sw { width: 22px; height: 22px; border-radius: 7px;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
  .meta { margin-top: 16px; font-size: 11.5px; color: #74747e; letter-spacing: .02em; }
</style></head><body>
  <div class="row">
    <div class="mark">
      <svg viewBox="0 0 32 32" width="34" height="34" fill="none"
        stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 9l7 8 7-8M16 17v8"/>
      </svg>
    </div>
    <h1>Pretty <span class="hn">HN</span></h1>
  </div>
  <p class="tag">A configurable skin for <b>Hacker News</b> — themes, keyboard nav,
    inline previews. In place, on the real site.</p>
  <div class="swatches">
    <div class="sw" style="background:#ff6600"></div>
    <div class="sw" style="background:#bd93f9"></div>
    <div class="sw" style="background:#88c0d0"></div>
    <div class="sw" style="background:#39ff14"></div>
    <div class="sw" style="background:#ff9b00"></div>
    <div class="sw" style="background:#10b981"></div>
    <div class="sw" style="background:#268bd2"></div>
  </div>
  <div class="meta">Open-source · local-first · no tracking</div>
</body></html>`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 440, height: 280 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "store-assets/promo-440x280.png" });
await browser.close();
console.log("done");
