// Run `onStable` once `measure()` returns the same value (within 1px) on two
// consecutive frames, or after `maxFrames` as a backstop. `schedule` defers to
// the next frame (requestAnimationFrame in the browser; injectable for tests).
export function onLayoutSettled(
  measure: () => number,
  onStable: () => void,
  schedule: (cb: () => void) => void = requestAnimationFrame,
  maxFrames = 30,
): void {
  let last = measure();
  let frames = 0;
  const tick = () => {
    const now = measure();
    if (Math.abs(now - last) < 1 || frames++ >= maxFrames) {
      onStable();
      return;
    }
    last = now;
    schedule(tick);
  };
  schedule(tick);
}
