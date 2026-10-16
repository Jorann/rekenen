import type { ReactNode } from 'react';
import type { HairPaint, HairStyle } from './look.ts';

/**
 * Hair is drawn in two parts: the back goes behind the head and body, the front (the fringe) over the face.
 * Coordinates are the avatar's: the head is an ellipse at (100, 92) with radii 52 × 50.
 */
interface HairDrawing {
  back?: (p: HairPaint) => ReactNode;
  front: (p: HairPaint) => ReactNode;
}

const stroke = (p: HairPaint) => ({ fill: p.base, stroke: p.dark, strokeWidth: 2.5, strokeLinejoin: 'round' as const });

/** The cap that covers the top of the head, with a side-swept fringe. */
function cap(p: HairPaint, fringe = 'swept'): ReactNode {
  const d =
    fringe === 'straight'
      ? 'M 45 108 C 38 62 64 32 100 32 C 136 32 162 62 155 108 C 152 96 150 86 147 78 C 132 82 114 82 100 80 C 86 82 68 82 53 78 C 50 86 48 96 45 108 Z'
      : fringe === 'short'
        ? 'M 46 100 C 40 60 64 32 100 32 C 136 32 160 60 154 100 C 150 90 147 80 142 72 C 128 78 112 70 104 62 C 96 74 74 82 58 74 C 54 82 49 90 46 100 Z'
        : 'M 45 108 C 38 62 64 32 100 32 C 136 32 162 62 155 108 C 151 96 148 84 141 74 C 130 82 112 80 103 66 C 96 78 76 84 60 76 C 54 84 49 96 45 108 Z';
  return (
    <>
      <path d={d} {...stroke(p)} />
      <path d="M 70 48 C 80 40 92 38 104 38" fill="none" stroke={p.light} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    </>
  );
}

/** Long locks falling down beside the face, in front of the shoulders. */
function sideLocks(p: HairPaint, bottom = 176): ReactNode {
  return (
    <>
      <path d={`M 46 92 C 38 120 38 150 44 ${bottom} C 52 ${bottom - 8} 58 ${bottom - 30} 58 ${bottom - 52} C 56 130 54 110 54 96 Z`} {...stroke(p)} />
      <path d={`M 154 92 C 162 120 162 150 156 ${bottom} C 148 ${bottom - 8} 142 ${bottom - 30} 142 ${bottom - 52} C 144 130 146 110 146 96 Z`} {...stroke(p)} />
    </>
  );
}

function tie(x: number, y: number): ReactNode {
  return (
    <g>
      <circle cx={x} cy={y} r={6} fill="#ff5e7e" stroke="#d93d63" strokeWidth={2} />
      <circle cx={x - 1.5} cy={y - 1.5} r={1.8} fill="#fff" opacity={0.7} />
    </g>
  );
}

/** A braid: overlapping rounded links from top to bottom. */
function braid(x: number, top: number, links: number, p: HairPaint, lean = 0): ReactNode {
  return Array.from({ length: links }, (_, i) => {
    const y = top + i * 13;
    const r = 9 - i * 0.4;
    return <ellipse key={i} cx={x + lean * i} cy={y} rx={r} ry={8} {...stroke(p)} />;
  });
}

function curls(cx: number, cy: number, rx: number, ry: number, count: number, r: number, from: number, to: number): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const a = from + ((to - from) * i) / (count - 1);
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r + (i % 2) * 2];
  });
}

const CURLS_BACK = curls(100, 100, 62, 66, 16, 15, Math.PI * 0.82, Math.PI * 2.18);
const CURLS_FRONT = curls(100, 56, 44, 18, 7, 11, Math.PI * 1.05, Math.PI * 1.95);

export const HAIR: Record<HairStyle, HairDrawing> = {
  long: {
    back: (p) => (
      <path d="M 50 74 C 30 112 30 162 36 192 C 42 204 56 204 64 196 C 74 206 88 206 100 198 C 112 206 126 206 136 196 C 144 204 158 204 164 192 C 170 162 170 112 150 74 Z" {...stroke(p)} />
    ),
    front: (p) => (
      <>
        {sideLocks(p)}
        {cap(p)}
      </>
    ),
  },
  ponytail: {
    back: (p) => (
      <>
        <path d="M 132 46 C 170 30 192 74 182 126 C 178 150 168 166 160 172 C 162 150 160 126 154 106 C 150 86 144 70 132 60 Z" {...stroke(p)} />
        <path d="M 168 80 C 174 100 174 124 168 146" fill="none" stroke={p.dark} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      </>
    ),
    front: (p) => (
      <>
        {cap(p)}
        {tie(140, 48)}
      </>
    ),
  },
  pigtails: {
    back: (p) => (
      <>
        <path d="M 54 70 C 24 62 8 104 14 140 C 18 160 26 170 32 174 C 32 152 36 128 46 108 Z" {...stroke(p)} />
        <path d="M 146 70 C 176 62 192 104 186 140 C 182 160 174 170 168 174 C 168 152 164 128 154 108 Z" {...stroke(p)} />
      </>
    ),
    front: (p) => (
      <>
        {cap(p)}
        {tie(52, 72)}
        {tie(148, 72)}
      </>
    ),
  },
  braids: {
    front: (p) => (
      <>
        <g>{braid(48, 112, 6, p, -0.6)}</g>
        <g>{braid(152, 112, 6, p, 0.6)}</g>
        {cap(p, 'straight')}
        {tie(45, 186)}
        {tie(155, 186)}
      </>
    ),
  },
  bob: {
    back: (p) => (
      <path d="M 50 70 C 32 98 30 132 36 150 C 40 158 52 158 58 150 C 80 158 120 158 142 150 C 148 158 160 158 164 150 C 170 132 168 98 150 70 Z" {...stroke(p)} />
    ),
    front: (p) => cap(p, 'straight'),
  },
  bun: {
    back: (p) => (
      <>
        <circle cx={100} cy={30} r={20} {...stroke(p)} />
        <path d="M 88 22 C 94 16 104 16 110 20" fill="none" stroke={p.light} strokeWidth={3.5} strokeLinecap="round" opacity={0.8} />
      </>
    ),
    front: (p) => (
      <>
        {cap(p)}
        <path d="M 86 44 Q 100 50 114 44" fill="none" stroke="#ff5e7e" strokeWidth={6} strokeLinecap="round" />
      </>
    ),
  },
  curly: {
    back: (p) => (
      <g {...stroke(p)}>
        <ellipse cx={100} cy={100} rx={62} ry={66} />
        {CURLS_BACK.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
    ),
    front: (p) => (
      <>
        <path d="M 45 104 C 38 62 64 32 100 32 C 136 32 162 62 155 104 C 148 84 128 70 100 70 C 72 70 52 84 45 104 Z" {...stroke(p)} />
        <g {...stroke(p)}>
          {CURLS_FRONT.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y + 14} r={r} />
          ))}
        </g>
      </>
    ),
  },
  short: {
    front: (p) => cap(p, 'short'),
  },
};
