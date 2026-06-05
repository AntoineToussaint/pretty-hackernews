# Launch assets — demo + Show HN

Recording tools: **Screen Studio** for the hero clip (auto-zoom on clicks),
**CleanShot X** for up to five static store screenshots (2 captured so far in
store-assets/). Capture at 1280×800 (or
2560×1600 retina → downscale). Clean bookmarks bar; blur or use a throwaway HN
username.

## 30-second demo script

| Time | On screen | Action |
|---|---|---|
| 0:00–0:03 | news.ycombinator.com, **Classic** theme, feed | Open cold. First frame must read as real, dense HN. Don't move — let it register. |
| 0:03–0:05 | cursor → top-right **gear** | Click to open the settings modal. |
| 0:05–0:13 | settings modal, theme list | Click **New Classic** (pause ~1s) → a dark one (**Nord/Dracula**) → **Bloomberg** or **Matrix**. Hero beat — ~2s per theme. Close modal. |
| 0:13–0:18 | a story's comments | Click into a story. Collapse one thread `[-]`, scroll a little. Calm. |
| 0:18–0:22 | an upvote arrow | Hover → click upvote. Count ticks, **no reload**. (Optional: `u` for keyboard upvote.) |
| 0:22–0:27 | a link story → **Preview** | Click Preview; clean inline article expands. Scroll one line. |
| 0:27–0:32 | **✨ AI brief** | Click. Spinner → article thesis + bullets, then thread verdict + comment picks. Hold, then stop. Last — AI reads as a bonus. |

Looping GIF for HN/Twitter: loop **0:05–0:13** (the theme morph). Keep < ~5MB.

## Store screenshot captions

1. Dense feed — "Real Hacker News — calmer. Classic density by default."
2. Story + comments — "Threaded comments, collapse, jump around — keyboard-first."
3. Settings modal (themes open) — "Make it yours: 13 themes, from faithful Classic to Bloomberg."
4. Inline preview — "Read the linked article inline. Never leave HN."
5. AI brief — "Optional, bring-your-own-key AI: summarizes the article + thread for you. Reading only — never posts."

## Show HN draft

**Title:**
> Show HN: Pretty Hacker News – an open-source, local-first re-skin of Hacker News

**Body:**

I read HN every day and kept wanting two small things — a real dark mode and
comment collapsing — without giving up the dense, fast layout I actually like.
Most readers and redesigns "fix" HN by adding padding until a screen shows eight
items instead of thirty. I didn't want that.

So Pretty Hacker News renders *in place* on news.ycombinator.com. Same URLs, same links, your
existing login — it just draws a cleaner UI over HN's own data. The default
theme is a faithful, dense "Classic" look; calmer and themed looks (including a
ridiculous Bloomberg terminal one) are one toggle away, and plain HN is always
one toggle back.

What it does: themes, instant no-reload navigation, keyboard nav, comment
collapsing, read/seen dimming, save-for-later, domain muting, and inline article
previews. You can upvote/comment/reply on your real account because it runs on
the page and uses the session already in your browser — it never sees or stores
your password.

On trust, since this touches a site you care about:
- It has **no backend and no analytics**. Everything is local.
- Permissions are scoped to news.ycombinator.com (plus optional, on-demand
  access only if you turn on article previews).
- The trust guarantees are enforced by tests that run in CI — no reading
  document.cookie, the logged-in session only ever goes to HN, previews are
  fetched without cookies, and it contacts no host outside a documented list.
- There's an **optional** AI brief (off by default, bring your own key, called
  directly from your browser to the provider). It exists only to *read* —
  summarize a thread, match stories to your interests. It will never write
  comments or vote for you; that's a covenant in the LICENSE.

It's MIT-licensed and the source is here:
https://github.com/AntoineToussaint/pretty-hackernews. It's a Chrome MV3
extension (load unpacked for now; Web Store review pending).

Would love feedback — especially from people who, like me, don't want HN to stop
looking like HN.
