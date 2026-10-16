import type { ReactNode } from 'react';
import { heartPath, starPath } from '../avatar/draw.tsx';
import { paint, type Paint } from '../avatar/look.ts';
import { RAINBOW_STOPS } from '../avatar/SharedDefs.tsx';

/**
 * The houses and everything for the garden. Each drawing has its own size (w × h, in garden units);
 * it stands on the middle of its bottom edge, which is the point that gets placed in the garden.
 */
export interface Thing {
  w: number;
  h: number;
  draw: (p: Paint) => ReactNode;
}

const INK = '#2f2440';
const o = (fill: string, stroke: string, width = 3) => ({ fill, stroke, strokeWidth: width, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
const WOOD = o('#c98f5a', '#8f5d33');
const WOOD_DARK = o('#a8703f', '#7a4b28');
const LEAF = o('#6bcb77', '#3f9c5a');
const WHITE = o('#ffffff', '#c9bfd9');
const GLASS = o('#bfe6ff', '#6aa7d9');

function windowPane(x: number, y: number, w: number, h: number, frame = WHITE): ReactNode {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} {...frame} />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={2} {...GLASS} strokeWidth={2} />
      <path d={`M ${x + w / 2} ${y + 5} L ${x + w / 2} ${y + h - 5} M ${x + 5} ${y + h / 2} L ${x + w - 5} ${y + h / 2}`} stroke={frame.fill} strokeWidth={3} />
      <path d={`M ${x + 9} ${y + 9} L ${x + 15} ${y + 9}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

function flowerBox(x: number, y: number, w: number): ReactNode {
  return (
    <g>
      {Array.from({ length: Math.floor(w / 12) }, (_, i) => (
        <circle key={i} cx={x + 7 + i * 12} cy={y - 3} r={5} fill={['#ff5e7e', '#ffd93d', '#ff8fd8', '#c9a8ff'][i % 4]} stroke="#fff" strokeWidth={1.5} />
      ))}
      <rect x={x} y={y} width={w} height={10} rx={3} {...WOOD} strokeWidth={2.5} />
    </g>
  );
}

function smoke(x: number, y: number): ReactNode {
  return (
    <g className="smoke" fill="#fff" opacity={0.85}>
      <circle cx={x} cy={y} r={9} />
      <circle cx={x + 10} cy={y - 16} r={11} />
      <circle cx={x + 4} cy={y - 34} r={13} />
    </g>
  );
}

function flag(x: number, y: number, color: string): ReactNode {
  return (
    <g>
      <path d={`M ${x} ${y} L ${x} ${y - 34}`} stroke="#8f5d33" strokeWidth={3} strokeLinecap="round" />
      <path className="flag" d={`M ${x} ${y - 34} Q ${x + 14} ${y - 38} ${x + 26} ${y - 30} Q ${x + 14} ${y - 24} ${x} ${y - 22} Z`} {...o(color, '#00000033', 2)} />
    </g>
  );
}

export const HOUSES: Record<string, Thing> = {
  tent: {
    w: 260,
    h: 200,
    draw: () => (
      <>
        <ellipse cx={130} cy={194} rx={120} ry={8} fill="rgba(60,90,40,0.18)" />
        <path d="M 20 190 L 130 30 L 240 190 Z" {...o('#ff8fd8', '#d6559f')} />
        <path d="M 130 30 L 75 190 L 105 190 Z M 130 30 L 155 190 L 185 190 Z" fill="#fff" opacity={0.75} />
        <path d="M 130 30 L 20 190 L 240 190 Z" fill="none" stroke="#d6559f" strokeWidth={3} strokeLinejoin="round" />
        <path d="M 130 70 C 112 110 104 150 100 190 L 160 190 C 156 150 148 110 130 70 Z" {...o('#5b3a6e', '#3b2a5c')} />
        <path d="M 130 70 C 122 110 110 150 96 190 L 112 190 C 120 150 126 110 130 70 Z" {...o('#ffc6e5', '#d6559f', 2)} />
        <path d="M 130 70 C 138 110 150 150 164 190 L 148 190 C 140 150 134 110 130 70 Z" {...o('#ffc6e5', '#d6559f', 2)} />
        {flag(130, 32, '#ffd93d')}
        <path d="M 20 190 L 6 196 M 240 190 L 254 196" stroke="#8f5d33" strokeWidth={3} strokeLinecap="round" />
      </>
    ),
  },
  cabin: {
    w: 300,
    h: 260,
    draw: () => (
      <>
        <ellipse cx={150} cy={254} rx={140} ry={8} fill="rgba(60,90,40,0.18)" />
        <rect x={196} y={42} width={26} height={50} {...o('#b07a52', '#7a4b28')} />
        {smoke(209, 30)}
        <rect x={40} y={110} width={220} height={140} {...WOOD} />
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M 40 ${132 + i * 22} L 260 ${132 + i * 22}`} stroke="#8f5d33" strokeWidth={2.5} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse key={i} cx={40} cy={121 + i * 22} rx={7} ry={10} {...WOOD_DARK} strokeWidth={2} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse key={i} cx={260} cy={121 + i * 22} rx={7} ry={10} {...WOOD_DARK} strokeWidth={2} />
        ))}
        <path d="M 20 118 L 150 30 L 280 118 Z" {...o('#5fbf73', '#2f8a4a')} />
        <path d="M 46 108 L 150 40 L 254 108" fill="none" stroke="#86d896" strokeWidth={4} strokeLinecap="round" />
        <circle cx={150} cy={86} r={14} {...WOOD_DARK} />
        <circle cx={150} cy={86} r={9} {...GLASS} strokeWidth={2} />
        <rect x={124} y={168} width={52} height={82} rx={6} {...o('#8f5d33', '#5e3a1f')} />
        <circle cx={166} cy={212} r={3.5} fill="#ffd93d" />
        {windowPane(60, 150, 46, 44, o('#fff4e0', '#8f5d33'))}
        {windowPane(194, 150, 46, 44, o('#fff4e0', '#8f5d33'))}
        {flowerBox(56, 196, 54)}
        {flowerBox(190, 196, 54)}
      </>
    ),
  },
  cottage: {
    w: 320,
    h: 290,
    draw: () => (
      <>
        <ellipse cx={160} cy={284} rx={150} ry={9} fill="rgba(60,90,40,0.18)" />
        <rect x={214} y={38} width={30} height={60} {...o('#ff9fa6', '#c95f6a')} />
        <rect x={210} y={32} width={38} height={12} rx={3} {...o('#ff9fa6', '#c95f6a')} />
        {smoke(229, 22)}
        <rect x={40} y={128} width={240} height={152} rx={6} {...o('#ffe1ec', '#e39ab8')} />
        <path d="M 14 136 L 160 30 L 306 136 Z" {...o('#9b5de5', '#6f3cb8')} />
        {[120, 100, 80].map((y) => {
          // Rows of roof tiles, as wide as the roof is at that height.
          const half = ((y - 30) / 106) * 146 - 14;
          const count = Math.floor((2 * half) / 22);
          const x = 160 - (count * 22) / 2;
          return <path key={y} d={`M ${x} ${y} ${'q 11 10 22 0 '.repeat(count)}`} fill="none" stroke="#6f3cb8" strokeWidth={2.5} opacity={0.5} />;
        })}
        <circle cx={160} cy={92} r={16} {...WHITE} />
        <path d={heartPath(160, 92, 8)} fill="#ff5e7e" />
        <path d="M 130 280 L 130 196 Q 160 166 190 196 L 190 280 Z" {...o('#ff8fb5', '#d6559f')} />
        <path d={heartPath(160, 212, 9)} fill="#fff" opacity={0.85} />
        <circle cx={180} cy={244} r={4} fill="#ffd93d" stroke="#e0a800" strokeWidth={1.5} />
        {windowPane(60, 168, 50, 50)}
        {windowPane(210, 168, 50, 50)}
        {flowerBox(56, 220, 58)}
        {flowerBox(206, 220, 58)}
        <path d="M 120 280 L 200 280 L 206 286 L 114 286 Z" {...o('#d9d0e6', '#a99bbf', 2)} />
      </>
    ),
  },
  castle: {
    w: 380,
    h: 410,
    draw: () => {
      const wall = o('#ffe9f4', '#d9a2c4');
      const roof = o('#a77bf0', '#7a4fcc');
      const tower = (x: number, top: number, w: number) => (
        <g>
          <rect x={x} y={top} width={w} height={350 - top} {...wall} />
          <path d={`M ${x - 10} ${top + 4} L ${x + w / 2} ${top - 70} L ${x + w + 10} ${top + 4} Z`} {...roof} />
          <path d={`M ${x + w / 2} ${top - 64} L ${x + w / 2 + 2} ${top + 2}`} stroke="#c9a8ff" strokeWidth={4} opacity={0.7} />
          {flag(x + w / 2, top - 68, '#ff5e7e')}
          <path d={`M ${x + w / 2 - 10} ${top + 60} L ${x + w / 2 - 10} ${top + 40} Q ${x + w / 2} ${top + 28} ${x + w / 2 + 10} ${top + 40} L ${x + w / 2 + 10} ${top + 60} Z`} {...GLASS} />
        </g>
      );
      return (
        <g transform="translate(0 50)">
          <ellipse cx={190} cy={352} rx={180} ry={9} fill="rgba(60,90,40,0.18)" />
          {tower(14, 130, 70)}
          {tower(296, 130, 70)}
          <rect x={80} y={160} width={220} height={190} {...wall} />
          <path
            d={`M 80 160 ${Array.from({ length: 7 }, (_, i) => `L ${80 + i * 31.4} 160 L ${80 + i * 31.4} 140 L ${80 + i * 31.4 + 18} 140 L ${80 + i * 31.4 + 18} 160`).join(' ')} L 300 160`}
            {...wall}
          />
          {tower(150, 60, 80)}
          <path d="M 150 350 L 150 280 Q 190 236 230 280 L 230 350 Z" {...o('#b07a52', '#7a4b28')} />
          <path d="M 170 270 L 170 350 M 190 258 L 190 350 M 210 270 L 210 350" stroke="#7a4b28" strokeWidth={2.5} />
          <path d={heartPath(190, 220, 14)} fill="#ff5e7e" stroke="#c2304f" strokeWidth={2.5} strokeLinejoin="round" />
          {windowPane(100, 200, 34, 44)}
          {windowPane(246, 200, 34, 44)}
          {[30, 330].map((x) => (
            <path key={x} d={`M ${x} 280 L ${x} 250 Q ${x + 10} 240 ${x + 20} 250 L ${x + 20} 280 Z`} {...GLASS} />
          ))}
          <path d={starPath(60, 30, 7)} fill="#ffd93d" />
          <path d={starPath(330, 40, 5)} fill="#fff" />
        </g>
      );
    },
  },
};

/** A little fenced patch of grass with a flag: her land, as a picture in the shop. */
export const LAND: Thing = {
  w: 220,
  h: 150,
  draw: () => (
    <>
      <ellipse cx={110} cy={110} rx={104} ry={36} {...o('#8be08f', '#4fb35a')} />
      <ellipse cx={110} cy={104} rx={92} ry={28} fill="#a5ea9f" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI * (1.05 + (0.9 * i) / 10);
        const x = 110 + Math.cos(a) * 92;
        const y = 104 + Math.sin(a) * 30;
        return <path key={i} d={`M ${x - 5} ${y} L ${x - 5} ${y - 22} L ${x} ${y - 28} L ${x + 5} ${y - 22} L ${x + 5} ${y} Z`} {...WHITE} strokeWidth={2} />;
      })}
      <path d="M 22 92 Q 110 58 198 92" fill="none" stroke="#c9bfd9" strokeWidth={3} />
      {flag(150, 108, '#ff5e7e')}
      <circle cx={80} cy={110} r={5} fill="#ff8fd8" />
      <circle cx={92} cy={118} r={4} fill="#ffd93d" />
      <circle cx={70} cy={120} r={4} fill="#fff" />
    </>
  ),
};

function petals(cx: number, cy: number, r: number, n: number, color: string, edge: string): ReactNode {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    return <ellipse key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} rx={r * 0.75} ry={r * 0.5} transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r})`} {...o(color, edge, 2)} />;
  });
}

function crown(cx: number, cy: number, r: number, fruit: boolean): ReactNode {
  const blobs: [number, number, number][] = [
    [cx, cy - r * 0.55, r * 0.62],
    [cx - r * 0.55, cy - r * 0.1, r * 0.55],
    [cx + r * 0.55, cy - r * 0.1, r * 0.55],
    [cx - r * 0.3, cy + r * 0.35, r * 0.5],
    [cx + r * 0.3, cy + r * 0.35, r * 0.5],
  ];
  return (
    <g>
      {blobs.map(([x, y, br], i) => (
        <circle key={i} cx={x} cy={y} r={br} {...LEAF} />
      ))}
      {blobs.map(([x, y, br], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={br - 3} fill="#6bcb77" />
      ))}
      <path d={`M ${cx - r * 0.5} ${cy - r * 0.6} q 8 -10 18 -8`} fill="none" stroke="#9be6a6" strokeWidth={4} strokeLinecap="round" />
      {fruit &&
        [
          [cx - r * 0.45, cy - r * 0.1],
          [cx + r * 0.35, cy - r * 0.45],
          [cx + r * 0.5, cy + r * 0.25],
          [cx - r * 0.1, cy + r * 0.4],
          [cx + r * 0.05, cy - r * 0.15],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={7} {...o('#ff5e7e', '#c2304f', 2)} />
            <circle cx={x - 2} cy={y - 2} r={2} fill="#fff" opacity={0.7} />
          </g>
        ))}
    </g>
  );
}

export const GARDEN: Record<string, Thing> = {
  tulip: {
    w: 36,
    h: 70,
    draw: (p) => (
      <>
        <path d="M 18 68 L 18 30" stroke="#3f9c5a" strokeWidth={4} strokeLinecap="round" />
        <path d="M 18 60 C 8 56 4 46 6 40 C 14 42 18 50 18 60 Z" {...LEAF} strokeWidth={2} />
        <path d="M 6 14 L 11 22 L 18 10 L 25 22 L 30 14 C 32 28 28 36 18 36 C 8 36 4 28 6 14 Z" {...o(p.base, p.dark, 2.5)} />
        <path d="M 12 20 Q 12 28 16 32" fill="none" stroke={p.light} strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
  },
  sunflower: {
    w: 50,
    h: 110,
    draw: () => (
      <>
        <path d="M 25 108 L 25 40" stroke="#3f9c5a" strokeWidth={5} strokeLinecap="round" />
        <path d="M 25 88 C 12 86 4 76 6 68 C 16 70 24 78 25 88 Z" {...LEAF} strokeWidth={2} />
        <path d="M 25 76 C 38 74 46 64 44 56 C 34 58 26 66 25 76 Z" {...LEAF} strokeWidth={2} />
        {petals(25, 26, 11, 12, '#ffd93d', '#e0a800')}
        <circle cx={25} cy={26} r={10} {...o('#8f5d33', '#5e3a1f', 2)} />
        <circle cx={22} cy={23} r={1.5} fill="#5e3a1f" />
        <circle cx={28} cy={27} r={1.5} fill="#5e3a1f" />
        <circle cx={24} cy={30} r={1.5} fill="#5e3a1f" />
      </>
    ),
  },
  mushroom: {
    w: 50,
    h: 50,
    draw: () => (
      <>
        <ellipse cx={25} cy={47} rx={18} ry={3} fill="rgba(60,90,40,0.18)" />
        <path d="M 17 46 L 19 26 L 31 26 L 33 46 Q 25 49 17 46 Z" {...o('#fff4e0', '#c9b08a', 2.5)} />
        <path d="M 4 28 C 4 10 14 4 25 4 C 36 4 46 10 46 28 Q 25 34 4 28 Z" {...o('#ff5e7e', '#c2304f', 2.5)} />
        <circle cx={16} cy={16} r={4} fill="#fff" />
        <circle cx={30} cy={11} r={3} fill="#fff" />
        <circle cx={36} cy={22} r={3.5} fill="#fff" />
        <circle cx={22} cy={25} r={2.5} fill="#fff" />
      </>
    ),
  },
  bush: {
    w: 90,
    h: 60,
    draw: () => (
      <>
        <ellipse cx={45} cy={56} rx={40} ry={4} fill="rgba(60,90,40,0.2)" />
        {[
          [22, 38, 18],
          [45, 28, 22],
          [68, 38, 18],
          [34, 44, 15],
          [56, 44, 15],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} {...LEAF} />
        ))}
        <path d="M 4 50 Q 45 62 86 50 L 86 56 L 4 56 Z" fill="#6bcb77" />
        <circle cx={30} cy={30} r={3} fill="#ff8fd8" />
        <circle cx={58} cy={22} r={3} fill="#fff" />
        <circle cx={66} cy={40} r={3} fill="#ff8fd8" />
      </>
    ),
  },
  tree: {
    w: 140,
    h: 200,
    draw: () => (
      <>
        <ellipse cx={70} cy={195} rx={46} ry={6} fill="rgba(60,90,40,0.2)" />
        <path d="M 58 196 L 62 110 L 78 110 L 82 196 Q 70 200 58 196 Z" {...WOOD} />
        <path d="M 66 140 Q 70 150 66 160" fill="none" stroke="#8f5d33" strokeWidth={2.5} strokeLinecap="round" />
        {crown(70, 76, 60, false)}
      </>
    ),
  },
  'apple-tree': {
    w: 150,
    h: 200,
    draw: () => (
      <>
        <ellipse cx={75} cy={195} rx={48} ry={6} fill="rgba(60,90,40,0.2)" />
        <path d="M 63 196 L 67 110 L 83 110 L 87 196 Q 75 200 63 196 Z" {...WOOD} />
        {crown(75, 76, 64, true)}
      </>
    ),
  },
  lantern: {
    w: 40,
    h: 120,
    draw: () => (
      <>
        <ellipse cx={20} cy={117} rx={12} ry={3} fill="rgba(60,90,40,0.2)" />
        <rect x={16} y={36} width={8} height={82} rx={3} {...o('#3b3355', '#231d36', 2)} />
        <circle className="glow" cx={20} cy={22} r={18} fill="#fff3a8" opacity={0.45} />
        <path d="M 8 32 L 32 32 L 28 12 L 12 12 Z" {...o('#fff3a8', '#3b3355', 2.5)} />
        <path d="M 6 12 L 34 12 L 20 2 Z" {...o('#3b3355', '#231d36', 2)} />
        <rect x={6} y={31} width={28} height={6} rx={2} {...o('#3b3355', '#231d36', 2)} />
      </>
    ),
  },
  birdhouse: {
    w: 60,
    h: 130,
    draw: () => (
      <>
        <ellipse cx={30} cy={127} rx={14} ry={3} fill="rgba(60,90,40,0.2)" />
        <rect x={26} y={60} width={8} height={68} rx={2} {...WOOD_DARK} strokeWidth={2} />
        <rect x={10} y={26} width={40} height={38} rx={3} {...o('#74b9ff', '#3f7fd8', 2.5)} />
        <path d="M 4 30 L 30 6 L 56 30 Z" {...o('#ff5e7e', '#c2304f', 2.5)} />
        <circle cx={30} cy={42} r={7} fill={INK} />
        <rect x={27} y={52} width={6} height={10} rx={2} {...WOOD} strokeWidth={1.5} />
        <g className="bird">
          <ellipse cx={46} cy={20} rx={7} ry={6} {...o('#ffd93d', '#e0a800', 1.8)} />
          <circle cx={48} cy={18} r={1.2} fill={INK} />
          <path d="M 53 19 L 57 20 L 53 21 Z" fill="#ff9f43" />
        </g>
      </>
    ),
  },
  mailbox: {
    w: 60,
    h: 100,
    draw: (p) => (
      <>
        <ellipse cx={30} cy={97} rx={14} ry={3} fill="rgba(60,90,40,0.2)" />
        <rect x={26} y={44} width={8} height={54} rx={2} {...WOOD_DARK} strokeWidth={2} />
        <path d="M 8 48 L 8 22 C 8 10 18 6 30 6 C 42 6 52 10 52 22 L 52 48 Z" {...o(p.base, p.dark, 2.5)} />
        <path d="M 14 22 C 14 14 20 12 30 12" fill="none" stroke={p.light} strokeWidth={3} strokeLinecap="round" />
        <path d={heartPath(30, 30, 6)} fill="#fff" opacity={0.9} />
        <path d="M 52 22 L 58 22 L 58 8 L 52 8" fill="#ff5e7e" stroke="#c2304f" strokeWidth={2} strokeLinejoin="round" />
      </>
    ),
  },
  bench: {
    w: 130,
    h: 75,
    draw: () => (
      <>
        <ellipse cx={65} cy={72} rx={56} ry={4} fill="rgba(60,90,40,0.2)" />
        <rect x={16} y={44} width={8} height={28} rx={2} {...WOOD_DARK} strokeWidth={2} />
        <rect x={106} y={44} width={8} height={28} rx={2} {...WOOD_DARK} strokeWidth={2} />
        <rect x={8} y={8} width={114} height={12} rx={4} {...WOOD} strokeWidth={2.5} />
        <rect x={8} y={24} width={114} height={12} rx={4} {...WOOD} strokeWidth={2.5} />
        <rect x={20} y={20} width={6} height={22} {...WOOD_DARK} strokeWidth={1.5} />
        <rect x={104} y={20} width={6} height={22} {...WOOD_DARK} strokeWidth={1.5} />
        <rect x={4} y={40} width={122} height={12} rx={4} {...WOOD} strokeWidth={2.5} />
      </>
    ),
  },
  doghouse: {
    w: 120,
    h: 110,
    draw: (p) => (
      <>
        <ellipse cx={60} cy={106} rx={52} ry={5} fill="rgba(60,90,40,0.2)" />
        <rect x={14} y={46} width={92} height={60} rx={3} {...o(p.base, p.dark)} />
        <path d="M 4 52 L 60 8 L 116 52 Z" {...o('#ff5e7e', '#c2304f')} />
        <path d="M 40 106 L 40 80 Q 60 58 80 80 L 80 106 Z" fill={INK} />
        <rect x={42} y={42} width={36} height={12} rx={3} {...WHITE} strokeWidth={2} />
        <path d="M 54 48 L 66 48" stroke="#9b5de5" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={96} cy={100} rx={9} ry={4} fill="#fff" stroke="#c9bfd9" strokeWidth={2} />
      </>
    ),
  },
  sandbox: {
    w: 160,
    h: 70,
    draw: () => (
      <>
        <path d="M 6 40 L 154 40 L 150 66 L 10 66 Z" {...WOOD} />
        <ellipse cx={80} cy={40} rx={74} ry={12} {...o('#ffe6a6', '#d9b45e')} />
        <path d="M 6 40 Q 80 58 154 40" fill="none" stroke="#8f5d33" strokeWidth={3} />
        <path d="M 40 36 C 46 22 62 22 66 36 Z" {...o('#ffd27a', '#d9b45e', 2)} />
        <path d="M 96 30 L 108 30 L 112 42 L 92 42 Z" {...o('#74b9ff', '#3f7fd8', 2)} />
        <path d="M 108 30 Q 102 22 96 30" fill="none" stroke="#3f7fd8" strokeWidth={2} />
        <path d="M 124 24 L 120 44 M 117 22 L 131 22 L 128 28 L 120 28 Z" {...o('#ff5e7e', '#c2304f', 2)} />
      </>
    ),
  },
  swing: {
    w: 180,
    h: 170,
    draw: () => (
      <>
        <ellipse cx={90} cy={166} rx={80} ry={5} fill="rgba(60,90,40,0.2)" />
        <path d="M 14 168 L 34 12 L 54 168 M 126 168 L 146 12 L 166 168" fill="none" stroke="#8f5d33" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 14 168 L 34 12 L 54 168 M 126 168 L 146 12 L 166 168" fill="none" stroke="#c98f5a" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={26} y={6} width={128} height={12} rx={5} {...WOOD} />
        <g className="swing-seat">
          <path d="M 70 18 L 70 124 M 110 18 L 110 124" stroke="#9b8fb5" strokeWidth={3} />
          <rect x={60} y={120} width={60} height={10} rx={4} {...o('#ff8fd8', '#d6559f', 2.5)} />
        </g>
      </>
    ),
  },
  pond: {
    w: 210,
    h: 90,
    draw: () => (
      <>
        <ellipse cx={105} cy={52} rx={100} ry={34} {...o('#9ea7b8', '#7d8796')} />
        <ellipse cx={105} cy={50} rx={90} ry={28} {...o('#74c5ff', '#3f8fd8')} />
        <path d="M 40 46 Q 60 40 80 46 M 130 58 Q 148 52 166 58" fill="none" stroke="#c8ebff" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={60} cy={58} rx={14} ry={6} fill="#6bcb77" stroke="#3f9c5a" strokeWidth={2} />
        <circle cx={60} cy={56} r={3.5} fill="#ff8fd8" />
        <g className="duck">
          <ellipse cx={130} cy={42} rx={16} ry={10} {...o('#ffd93d', '#e0a800', 2.2)} />
          <circle cx={142} cy={30} r={8} {...o('#ffd93d', '#e0a800', 2.2)} />
          <circle cx={145} cy={28} r={1.6} fill={INK} />
          <path d="M 149 31 L 157 32 L 149 35 Z" fill="#ff9f43" stroke="#e07a1f" strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M 122 40 Q 128 36 134 42" fill="none" stroke="#e0a800" strokeWidth={2} strokeLinecap="round" />
        </g>
        <path d="M 18 40 L 14 18 M 24 42 L 26 14" stroke="#3f9c5a" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={14} cy={16} rx={3} ry={7} fill="#8f5d33" />
        <ellipse cx={26} cy={12} rx={3} ry={7} fill="#8f5d33" />
      </>
    ),
  },
  slide: {
    w: 180,
    h: 150,
    draw: (p) => (
      <>
        <ellipse cx={90} cy={146} rx={82} ry={5} fill="rgba(60,90,40,0.2)" />
        <path d="M 20 146 L 30 20 M 56 146 L 62 20" stroke="#3f7fd8" strokeWidth={6} strokeLinecap="round" />
        {[46, 72, 98, 124].map((y) => (
          <path key={y} d={`M ${28 - (y - 20) * 0.08} ${y} L ${60 - (y - 20) * 0.05} ${y}`} stroke="#3f7fd8" strokeWidth={4} strokeLinecap="round" />
        ))}
        <rect x={24} y={14} width={44} height={10} rx={3} {...o('#74b9ff', '#3f7fd8', 2.5)} />
        <path d="M 62 16 C 100 20 120 120 172 136 L 172 146 C 116 132 96 34 62 30 Z" {...o(p.base, p.dark)} />
        <path d="M 68 22 C 100 30 118 116 166 134" fill="none" stroke={p.light} strokeWidth={3} strokeLinecap="round" />
        <path d="M 120 120 L 120 146" stroke="#3f7fd8" strokeWidth={5} strokeLinecap="round" />
      </>
    ),
  },
  trampoline: {
    w: 180,
    h: 90,
    draw: () => (
      <>
        <ellipse cx={90} cy={86} rx={80} ry={5} fill="rgba(60,90,40,0.2)" />
        {[24, 62, 118, 156].map((x) => (
          <path key={x} d={`M ${x} 44 L ${x + (x < 90 ? -6 : 6)} 86`} stroke="#3b3355" strokeWidth={5} strokeLinecap="round" />
        ))}
        <ellipse cx={90} cy={42} rx={84} ry={24} {...o('#4d6bff', '#2f4ed6')} />
        <ellipse cx={90} cy={40} rx={70} ry={17} {...o('#3b3355', '#231d36', 2)} />
        <path d="M 40 36 Q 90 26 140 36" fill="none" stroke="#5a5277" strokeWidth={3} strokeLinecap="round" />
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={90 + Math.cos((i / 10) * Math.PI * 2) * 78} cy={42 + Math.sin((i / 10) * Math.PI * 2) * 21} r={3} fill={RAINBOW_STOPS[i % 6]} />
        ))}
      </>
    ),
  },
  fountain: {
    w: 150,
    h: 140,
    draw: () => (
      <>
        <ellipse cx={75} cy={118} rx={70} ry={20} {...o('#d9d0e6', '#a99bbf')} />
        <ellipse cx={75} cy={114} rx={58} ry={14} {...o('#74c5ff', '#3f8fd8', 2.5)} />
        <rect x={67} y={60} width={16} height={56} rx={4} {...o('#ece6f5', '#a99bbf', 2.5)} />
        <ellipse cx={75} cy={62} rx={34} ry={9} {...o('#ece6f5', '#a99bbf', 2.5)} />
        <ellipse cx={75} cy={60} rx={26} ry={6} fill="#9fd7ff" />
        <g className="water" fill="none" stroke="#9fd7ff" strokeWidth={4} strokeLinecap="round">
          <path d="M 75 54 C 75 30 60 20 46 50" />
          <path d="M 75 54 C 75 30 90 20 104 50" />
          <path d="M 75 54 L 75 22" />
        </g>
        <circle cx={75} cy={20} r={5} fill="#c8ebff" />
        <circle cx={44} cy={54} r={3} fill="#c8ebff" />
        <circle cx={106} cy={54} r={3} fill="#c8ebff" />
      </>
    ),
  },
  'rainbow-arch': {
    w: 250,
    h: 150,
    draw: () => (
      <>
        {RAINBOW_STOPS.map((c, i) => {
          const r = 110 - i * 13;
          return <path key={c} d={`M ${125 - r} 136 A ${r} ${r} 0 0 1 ${125 + r} 136`} fill="none" stroke={c} strokeWidth={13} />;
        })}
        {[18, 232].map((x) => (
          <g key={x} fill="#fff" stroke="#e1d7f0" strokeWidth={2}>
            <circle cx={x} cy={136} r={16} />
            <circle cx={x - 14} cy={140} r={11} />
            <circle cx={x + 14} cy={140} r={11} />
          </g>
        ))}
        <path d={starPath(125, 20, 8)} fill="#ffd93d" className="twinkle" />
      </>
    ),
  },
};

/** Garden things she can colour use the shop's clothing colours. */
export function thingPaint(color: string | undefined): Paint {
  return paint(color ?? '#ff5e7e');
}
