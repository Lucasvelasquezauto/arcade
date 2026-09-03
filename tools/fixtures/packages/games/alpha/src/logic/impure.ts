// VIOLACIONES DELIBERADAS (Art. 3.1 – 3.3). Este archivo DEBE fallar el lint.
export function impure(): number {
  setTimeout(() => {}, 100);
  const t = Date.now();
  const r = Math.random();
  const w = window.innerWidth;
  const now = performance.now();
  const d = new Date();
  return t + r + w + now + d.getTime();
}
