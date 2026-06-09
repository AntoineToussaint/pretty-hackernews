import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("store-assets", { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background:
      radial-gradient(120% 90% at 100% 0%, rgba(255,61,127,.20), transparent 55%),
      radial-gradient(110% 90% at 0% 100%, rgba(255,122,24,.18), transparent 55%),
      #0a0a0c;
    color: #f4f4f5;
    display: flex; flex-direction: column; justify-content: center;
    padding: 84px 96px; overflow: hidden;
  }
  .row { display: flex; align-items: center; gap: 28px; }
  .mark { width: 104px; height: 104px; border-radius: 28px; flex: none;
    background: linear-gradient(135deg, #ff7a18, #ff3d7f);
    box-shadow: 0 14px 44px rgba(255,80,40,.4);
    display: grid; place-items: center; }
  h1 { font-size: 72px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  h1 .hn { color: #ff8a3d; }
  p.tag { margin-top: 40px; font-size: 33px; line-height: 1.4; color: #cdcdd5;
    max-width: 880px; font-weight: 400; }
  p.tag b { color: #f4f4f5; font-weight: 600; }
  .swatches { margin-top: 44px; display: flex; gap: 16px; align-items: center; }
  .sw { width: 40px; height: 40px; border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
  .meta { margin-top: 30px; font-size: 22px; color: #74747e; letter-spacing: .02em; }
</style></head><body>
  <div class="row">
    <div class="mark">
      <svg viewBox="0 0 32 32" width="62" height="62" fill="none"
        stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 9l7 8 7-8M16 17v8"/>
      </svg>
    </div>
    <h1>Pretty <span class="hn">HN</span></h1>
  </div>
  <p class="tag">A configurable skin for <b>Hacker News</b> — themes, keyboard nav,
    and inline article previews, in place on the real site.</p>
  <div class="swatches">
    <div class="sw" style="background:#ff6600"></div>
    <div class="sw" style="background:#bd93f9"></div>
    <div class="sw" style="background:#88c0d0"></div>
    <div class="sw" style="background:#39ff14"></div>
    <div class="sw" style="background:#ff9b00"></div>
    <div class="sw" style="background:#10b981"></div>
    <div class="sw" style="background:#268bd2"></div>
  </div>
  <div class="meta">Open-source · local-first · no tracking · bring-your-own-key AI</div>
</body></html>`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "store-assets/og-card.png" });
await browser.close();
console.log("done");
