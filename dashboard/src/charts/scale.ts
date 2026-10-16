import { useEffect, useRef, useState } from 'react';

/** Round tick values from 0 up to (at least) max, about `count` of them. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw)!;
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Which x labels to show so they don't collide: about one per `spacing` pixels, always the last one. */
export function labelEvery(count: number, width: number, spacing = 64): number {
  return Math.max(1, Math.ceil(count / Math.max(1, Math.floor(width / spacing))));
}

/** The width of an element, kept up to date. */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** A bar with a 4px rounded data-end and a square baseline. Vertical bars round the top, horizontal the right. */
export function barPath(x: number, y: number, w: number, h: number, horizontal = false, radius = 4): string {
  if (w <= 0 || h <= 0) return '';
  if (horizontal) {
    const r = Math.min(radius, h / 2, w);
    return `M ${x} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x} Z`;
  }
  const r = Math.min(radius, w / 2, h);
  return `M ${x} ${y + h} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h} Z`;
}
