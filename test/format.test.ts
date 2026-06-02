import { test, expect } from "bun:test";
import { hostname, faviconUrl, timeAgo } from "../src/lib/format";

test("hostname strips www and ignores junk", () => {
  expect(hostname("https://www.example.com/a/b")).toBe("example.com");
  expect(hostname("https://news.ycombinator.com/item?id=1")).toBe(
    "news.ycombinator.com",
  );
  expect(hostname(null)).toBe(null);
  expect(hostname("not a url")).toBe(null);
});

test("faviconUrl points at a favicon service for the host", () => {
  expect(faviconUrl("https://example.com")).toContain("example.com");
  expect(faviconUrl(null)).toBe(null);
});

test("timeAgo formats relative times", () => {
  const now = Date.now() / 1000;
  expect(timeAgo(now)).toBe("just now");
  expect(timeAgo(now - 120)).toBe("2m ago");
  expect(timeAgo(now - 3 * 3600)).toBe("3h ago");
});
