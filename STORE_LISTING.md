# Chrome Web Store listing — Hatch

Upload package: `build/chrome-mv3-prod.zip` (run `bun run plasmo:zip` to regenerate).

## Name
Hatch — a calmer Hacker News

## Summary (≤132 chars)
A calmer, modern Hacker News — in place. Themes, keyboard nav, inline article previews, and vote/comment on your own account.

## Category
Productivity (or News & Weather)

## Detailed description
Hatch restyles news.ycombinator.com in place — same page, same links, your
existing login — into a calm, modern reader. It renders its own clean UI over
HN's data, so you get a real design instead of a recolor.

Features
• Five themes (dark + light), switchable from the in-page settings.
• Instant, no-reload navigation between feeds and stories; back/forward work.
• Keyboard navigation — j/k to move, o/Enter to open, u to upvote.
• Upvote, comment, and reply on your real HN account (no passwords stored).
• Read/seen dimming so you don't re-read the same stories.
• Velocity badges on fast-rising stories and an "OP" badge on submitter comments.
• Save stories, mute domains, collapse comment threads, set a default feed.
• Optional inline article previews — read the linked page (clean text + image)
  without leaving HN.

Local-first: no accounts, no servers, no tracking. Your settings, bookmarks and
history live only in your browser.

Not affiliated with Y Combinator.

## Permission justifications (Web Store review form)
- Host access to news.ycombinator.com: to render the reader on HN and to vote/
  comment using your existing HN session.
- storage: to save your theme, seen-stories, bookmarks, muted domains, and
  default feed locally on your device.
- declarativeNetRequest: to remove HN's Content-Security-Policy on HN's own
  pages so the reader can display site icons, the Inter font, and article
  preview images. No network requests are blocked or redirected.
- Optional broad host access (requested only if you turn on "Article previews"):
  to fetch a single linked page when you click "Preview", so its text can be
  shown inline. Nothing is fetched unless you click Preview.

## Privacy / data use
- Does not collect or transmit any user data.
- No analytics, no remote servers, no third parties.
- Talks only to news.ycombinator.com — plus the specific page you click
  "Preview" on, if you've enabled previews.

## Assets still needed
- 1–5 screenshots, 1280×800 or 640×400 (capture from a real logged-in session:
  the feed, a story with comments, the settings popover, an open preview).
- A small promo tile (440×280) is optional but recommended.
- A privacy policy URL (a short GitHub Pages / gist page restating the above).
