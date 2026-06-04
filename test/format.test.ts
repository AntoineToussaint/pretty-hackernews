import { test, expect } from "bun:test";
import { hostname, monogram, hueFor, timeAgo } from "../src/lib/format";

test("hostname strips www and ignores junk", () => {
  expect(hostname("https://www.example.com/a/b")).toBe("example.com");
  expect(hostname("https://news.ycombinator.com/item?id=1")).toBe(
    "news.ycombinator.com",
  );
  expect(hostname(null)).toBe(null);
  expect(hostname("not a url")).toBe(null);
});

test("monogram is the first alphanumeric letter, uppercased", () => {
  expect(monogram("example.com")).toBe("E");
  expect(monogram("www.example.com")).toBe("E");
  expect(monogram("news.ycombinator.com")).toBe("N");
  expect(monogram(null)).toBe("");
});

test("hueFor is deterministic and in range", () => {
  const h = hueFor("example.com");
  expect(h).toBe(hueFor("example.com"));
  expect(h).toBeGreaterThanOrEqual(0);
  expect(h).toBeLessThan(360);
});

test("timeAgo formats relative times", () => {
  const now = Date.now() / 1000;
  expect(timeAgo(now)).toBe("just now");
  expect(timeAgo(now - 120)).toBe("2m ago");
  expect(timeAgo(now - 3 * 3600)).toBe("3h ago");
});
