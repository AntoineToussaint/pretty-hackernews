import type { Source } from "../types";
import { Feed } from "./Feed";
import { Story } from "./Story";
import { AccountStatus } from "./AccountStatus";

/** Parse a pasted HN link or bare item id into an item id. */
function parseHnId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  const idMatch = trimmed.match(/[?&]id=(\d+)/);
  if (idMatch) return idMatch[1];
  const storyMatch = trimmed.match(/\/(?:story|item)\/(\d+)/);
  if (storyMatch) return storyMatch[1];
  return null;
}

export const hnSource: Source = {
  id: "hn",
  name: "Hacker News",
  feeds: [
    { id: "top", label: "Top" },
    { id: "new", label: "New" },
    { id: "best", label: "Best" },
    { id: "ask", label: "Ask" },
    { id: "show", label: "Show" },
    { id: "jobs", label: "Jobs" },
  ],
  defaultFeed: "top",
  searchPlaceholder: "Paste an HN link or item ID…",
  submitUrl: "https://news.ycombinator.com/submit",
  parseItemId: parseHnId,
  FeedView: Feed,
  ItemView: Story,
  AccountStatus,
};
