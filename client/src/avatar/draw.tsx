import type { ReactNode } from 'react';

/** Small drawing helpers shared by the avatar's body, hair and clothes. */

/** Draws the children, and again mirrored around the avatar's middle (x = 100). */
export function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform="matrix(-1 0 0 1 200 0)">{children}</g>
    </>
  );
}

/** A thick rounded stroke with an outline: arms, legs and sleeves. */
export function Limb({
  from,
  to,
  width,
  fill,
  outline,
}: {
  from: [number, number];
  to: [number, number];
  width: number;
  fill: string;
  outline: string;
}) {
  const d = `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`;
  return (
    <>
      <path d={d} stroke={outline} strokeWidth={width + 5} strokeLinecap="round" fill="none" />
      <path d={d} stroke={fill} strokeWidth={width} strokeLinecap="round" fill="none" />
    </>
  );
}

/** A point part of the way along a line. */
export function along(from: [number, number], to: [number, number], t: number): [number, number] {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

/** Shoulder and hand positions of the left arm; the right arm mirrors them. */
export const ARM: { from: [number, number]; to: [number, number] } = { from: [79, 159], to: [66, 203] };
export const ARM_WIDTH = 14;
export const HAND: [number, number] = [65, 207];

/** A five-pointed star centred on (cx, cy). */
export function starPath(cx: number, cy: number, outer: number, inner = outer * 0.45): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  });
  return `M ${points.join(' L ')} Z`;
}

/** A heart centred on (cx, cy), about 2 × size wide. */
export function heartPath(cx: number, cy: number, size: number): string {
  const s = size;
  return `M ${cx} ${cy + s * 0.9} C ${cx - s * 1.4} ${cy - s * 0.1} ${cx - s * 0.9} ${cy - s * 1.2} ${cx} ${cy - s * 0.45} C ${cx + s * 0.9} ${cy - s * 1.2} ${cx + s * 1.4} ${cy - s * 0.1} ${cx} ${cy + s * 0.9} Z`;
}
