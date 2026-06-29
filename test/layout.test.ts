import { test, expect } from "bun:test";
import { onLayoutSettled } from "../src/lib/layout";

// Drain a queue of scheduled callbacks synchronously, so the rAF loop runs to
// completion within the test.
function drainScheduler() {
  const queue: Array<() => void> = [];
  const schedule = (cb: () => void) => {
    queue.push(cb);
  };
  const run = () => {
    while (queue.length) queue.shift()!();
  };
  return { schedule, run };
}

test("scrolls only after the measured position stops shifting", () => {
  // Layout reflows for three frames (ancestor expansion pushing the target
  // down), then settles at 500.
  const tops = [100, 250, 400, 500, 500, 500];
  let i = 0;
  const measure = () => tops[Math.min(i++, tops.length - 1)];

  let scrolledAt = -1;
  const { schedule, run } = drainScheduler();
  onLayoutSettled(measure, () => (scrolledAt = i), schedule, 30);
  run();

  // It must not fire while the value is still moving; it fires once two
  // consecutive reads match (the 500/500 pair).
  expect(scrolledAt).toBeGreaterThan(0);
  expect(tops[scrolledAt - 1]).toBe(500);
});

test("fires immediately when layout is already stable", () => {
  let calls = 0;
  let scrolled = false;
  const { schedule, run } = drainScheduler();
  onLayoutSettled(
    () => {
      calls++;
      return 42;
    },
    () => (scrolled = true),
    schedule,
    30,
  );
  run();

  expect(scrolled).toBe(true);
  // One initial read plus one frame to confirm stability.
  expect(calls).toBe(2);
});

test("gives up after maxFrames even if never stable", () => {
  let n = 0;
  const measure = () => n++ * 10; // strictly increasing, never settles
  let scrolled = false;
  const { schedule, run } = drainScheduler();
  onLayoutSettled(measure, () => (scrolled = true), schedule, 5);
  run();

  expect(scrolled).toBe(true);
});
