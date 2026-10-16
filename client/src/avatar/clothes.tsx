import type { ReactNode } from 'react';
import { along, ARM, ARM_WIDTH, HAND, heartPath, Limb, Mirror, starPath } from './draw.tsx';
import type { Paint } from './look.ts';
import { RAINBOW_STOPS } from './SharedDefs.tsx';

/**
 * Drawings of everything she can wear, keyed by catalog id, in the avatar's coordinates (viewBox 0 -40 200 320).
 * An item can draw in up to three layers:
 *   back  behind the hair and body (wings, cape, backpack)
 *   main  its slot's own layer (see Avatar.tsx for the order). Arms are under tops and dresses, hands over them.
 *   over  over the hands and clothes (straps, cape ties)
 */
export type Draw = (p: Paint, skin: Paint) => ReactNode;

export interface Wearable {
  back?: Draw;
  main?: Draw;
  over?: Draw;
  /** viewBox for the item's picture in the shop, when the slot's default doesn't fit. */
  thumb?: string;
}

const line = (p: Paint, width = 2.5) => ({ fill: p.base, stroke: p.dark, strokeWidth: width, strokeLinejoin: 'round' as const });
const outline = (fill: string, stroke: string, width = 2.5) => ({ fill, stroke, strokeWidth: width, strokeLinejoin: 'round' as const });
const INK = '#2f2440';
const GOLD = { fill: 'url(#gold)', stroke: '#c98a00', strokeWidth: 2, strokeLinejoin: 'round' as const };
const SILVER = { fill: 'url(#silver)', stroke: '#8e9ab3', strokeWidth: 2, strokeLinejoin: 'round' as const };

/** Something on her clothes in a colour that stands out against the clothes themselves. */
function contrast(p: Paint, preferred = '#ff5e7e'): string {
  return p.base.toLowerCase() === preferred ? '#ffffff' : preferred;
}

// ---------- tops ----------

/** The body of a top, from the shoulders to just over the waistband. */
const TORSO = 'M 75 161 Q 75 150 87 150 L 113 150 Q 125 150 125 161 L 127 214 Q 100 220 73 214 Z';

function sleeve(p: Paint, length: number, fill = p.base): ReactNode {
  return (
    <Mirror>
      <Limb from={ARM.from} to={along(ARM.from, ARM.to, length)} width={ARM_WIDTH + 5} fill={fill} outline={p.dark} />
    </Mirror>
  );
}

function puffSleeve(p: Paint): ReactNode {
  return (
    <Mirror>
      <path d="M 70 156 C 66 166 66 178 74 182 C 80 184 86 176 86 168 C 86 158 80 150 70 156 Z" {...line(p)} />
      <path d="M 71 176 Q 77 180 84 175" fill="none" stroke={p.dark} strokeWidth={1.8} strokeLinecap="round" />
    </Mirror>
  );
}

function neckline(skin: Paint): ReactNode {
  return <path d="M 90 150 Q 100 161 110 150 Z" fill={skin.base} stroke={skin.dark} strokeWidth={1.5} />;
}

/** A top: sleeves first, so the body covers where they join, like a seam. */
function top(sleeves: (p: Paint) => ReactNode, extra?: (p: Paint) => ReactNode): Wearable {
  return {
    main: (p, skin) => (
      <>
        {sleeves(p)}
        <path d={TORSO} {...line(p)} />
        {extra?.(p)}
        {neckline(skin)}
      </>
    ),
  };
}

// ---------- bottoms ----------

const TROUSERS = 'M 76 203 L 124 203 L 124 252 L 102 252 L 100 224 L 98 252 L 76 252 Z';
const SKIRT = 'M 77 203 L 123 203 L 135 238 Q 100 245 65 238 Z';

// ---------- dresses ----------

const BODICE = 'M 77 160 Q 77 151 88 151 L 112 151 Q 123 151 123 160 L 124 203 L 76 203 Z';

function bodice(p: Paint, skin: Paint): ReactNode {
  return (
    <>
      <path d={BODICE} {...line(p)} />
      {neckline(skin)}
    </>
  );
}

// ---------- shoes ----------

function sneaker(p: Paint): ReactNode {
  return (
    <Mirror>
      <path d="M 73 259 C 71 249 79 242 86 242 C 94 242 100 249 100 259 Z" {...line(p)} />
      <rect x={70} y={256} width={32} height={8.5} rx={4.2} fill="#fff" stroke="#c9bfd9" strokeWidth={2} />
      <path d="M 82 248 L 90 248 M 82 252.5 L 91 252.5" stroke={p.dark} strokeWidth={1.8} strokeLinecap="round" />
    </Mirror>
  );
}

function flat(p: Paint, bow: ReactNode): ReactNode {
  return (
    <Mirror>
      <path d="M 73 258 C 72 251 79 248 86 248 C 93 248 100 251 99 258 C 99 263 93 264 86 264 C 79 264 73 263 73 258 Z" {...line(p)} />
      <path d="M 77 252 Q 86 256 95 252" fill="none" stroke={p.dark} strokeWidth={1.6} strokeLinecap="round" />
      {bow}
    </Mirror>
  );
}

// ---------- hand-held things, in the right hand ----------

const [HX, HY] = [200 - HAND[0], HAND[1]];

/** The fingers over a held stick, so it looks like she holds it. */
function fist(skin: Paint): ReactNode {
  return <circle cx={HX} cy={HY} r={8.5} fill={skin.base} stroke={skin.dark} strokeWidth={2.5} />;
}

function stick(toX: number, toY: number, color = '#ffffff', edge = '#c9bfd9'): ReactNode {
  return <Limb from={[HX, HY + 4]} to={[toX, toY]} width={3.5} fill={color} outline={edge} />;
}

// ---------- the catalog's drawings ----------

export const WEARABLES: Record<string, Wearable> = {
  // Hats
  bow: {
    main: (p) => (
      <g transform="rotate(-14 132 42)">
        <path d="M 132 42 L 126 60 L 132 58 L 134 64 L 136 44 Z" {...line(p, 2)} />
        <path d="M 132 42 C 118 26 104 34 108 46 C 111 56 124 52 132 42 Z" {...line(p)} />
        <path d="M 132 42 C 146 26 160 34 156 46 C 153 56 140 52 132 42 Z" {...line(p)} />
        <path d="M 114 40 Q 118 36 124 40 M 150 40 Q 146 36 140 40" fill="none" stroke={p.light} strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx={132} cy={42} rx={6} ry={7} {...line(p)} />
      </g>
    ),
  },
  cap: {
    main: (p) => (
      <>
        <path d="M 47 70 C 47 36 72 22 100 22 C 128 22 153 36 153 70 Q 100 60 47 70 Z" {...line(p)} />
        <path d="M 100 22 L 100 64 M 74 30 Q 66 46 64 66 M 126 30 Q 134 46 136 66" fill="none" stroke={p.dark} strokeWidth={1.8} />
        <path d="M 44 68 Q 100 56 156 68 C 156 78 140 86 100 86 C 60 86 44 78 44 68 Z" {...outline(p.dark, p.dark)} />
        <path d="M 52 70 Q 100 62 148 70" fill="none" stroke={p.base} strokeWidth={2} opacity={0.6} />
        <circle cx={100} cy={22} r={4.5} {...line(p, 2)} />
        <path d="M 66 38 Q 76 30 90 28" fill="none" stroke={p.light} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      </>
    ),
  },
  beanie: {
    main: (p) => (
      <>
        <path d="M 46 66 C 46 30 72 18 100 18 C 128 18 154 30 154 66 Z" {...line(p)} />
        <path d="M 70 26 Q 64 44 64 62 M 100 18 L 100 62 M 130 26 Q 136 44 136 62" fill="none" stroke={p.dark} strokeWidth={1.6} opacity={0.6} />
        <path d="M 42 60 Q 100 46 158 60 L 159 76 Q 100 64 41 76 Z" {...outline(p.light, p.dark)} />
        {[52, 62, 72, 82, 92, 102, 112, 122, 132, 142].map((x) => (
          <path key={x} d={`M ${x + 2} ${57 - (x > 100 ? 100 - x : x - 100) * -0.02} L ${x + 2} ${70}`} stroke={p.dark} strokeWidth={1.4} opacity={0.4} />
        ))}
        <circle cx={100} cy={14} r={13} {...outline(p.light, p.dark)} />
        <path d="M 92 9 Q 97 4 104 6" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      </>
    ),
  },
  'flower-crown': {
    main: () => (
      <>
        <path d="M 50 70 C 56 46 76 36 100 36 C 124 36 144 46 150 70" fill="none" stroke="#5fae5a" strokeWidth={4} strokeLinecap="round" />
        {[
          [52, 64, '#ff8fd8', -40],
          [64, 48, '#ffffff', -20],
          [82, 39, '#c9a8ff', 10],
          [100, 35, '#ff8fd8', 0],
          [118, 39, '#ffd93d', -10],
          [136, 48, '#ffffff', 20],
          [148, 64, '#c9a8ff', 40],
        ].map(([x, y, color, turn], i) => (
          <g key={i} transform={`rotate(${turn} ${x} ${y})`}>
            <path d={`M ${+x - 9} ${+y + 2} q 4 -6 8 -2 q -4 6 -8 2 Z`} fill="#6bcb77" stroke="#3f9c5a" strokeWidth={1.2} />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle
                key={a}
                cx={+x + Math.cos((a * Math.PI) / 180) * 4.8}
                cy={+y + Math.sin((a * Math.PI) / 180) * 4.8}
                r={4.2}
                fill={color as string}
                stroke="#d58ac9"
                strokeWidth={1.2}
              />
            ))}
            <circle cx={x} cy={y} r={3} fill="#ffd93d" stroke="#e8a800" strokeWidth={1} />
          </g>
        ))}
      </>
    ),
  },
  'cat-ears': {
    main: (p) => (
      <>
        <path d="M 52 72 C 54 42 76 30 100 30 C 124 30 146 42 148 72" fill="none" stroke={p.dark} strokeWidth={6} strokeLinecap="round" />
        <path d="M 52 72 C 54 42 76 30 100 30 C 124 30 146 42 148 72" fill="none" stroke={p.base} strokeWidth={3} strokeLinecap="round" />
        <Mirror>
          <path d="M 54 52 L 58 14 L 86 34 Z" {...line(p)} />
          <path d="M 60 44 L 62 25 L 77 36 Z" fill="#ffb3cf" />
        </Mirror>
      </>
    ),
  },
  headphones: {
    main: (p) => (
      <>
        <path d="M 46 96 C 40 50 66 24 100 24 C 134 24 160 50 154 96" fill="none" stroke={p.dark} strokeWidth={9} strokeLinecap="round" />
        <path d="M 46 96 C 40 50 66 24 100 24 C 134 24 160 50 154 96" fill="none" stroke={p.base} strokeWidth={5} strokeLinecap="round" />
        <Mirror>
          <rect x={34} y={84} width={20} height={34} rx={9} {...line(p)} />
          <rect x={44} y={90} width={8} height={22} rx={4} fill={p.light} />
        </Mirror>
      </>
    ),
  },
  'witch-hat': {
    thumb: '20 -40 160 110',
    main: (p) => (
      <>
        <path d="M 66 50 C 74 26 84 4 98 -10 C 104 -16 114 -28 124 -26 C 120 -18 116 -12 116 -2 C 118 14 126 32 134 50 Z" {...line(p)} />
        <path d="M 72 42 Q 100 48 130 42 L 133 50 Q 100 56 68 50 Z" fill="#ffd93d" stroke="#e0a800" strokeWidth={2} />
        <ellipse cx={100} cy={52} rx={64} ry={11} {...line(p)} />
        <path d="M 66 50 Q 100 58 134 50" fill="none" stroke={p.dark} strokeWidth={2} />
        <path d={starPath(104, 18, 6)} fill="#ffd93d" stroke="#e0a800" strokeWidth={1.2} />
        <path d={starPath(92, 32, 3.5)} fill="#fff" />
      </>
    ),
  },
  tiara: {
    main: () => (
      <>
        <path d="M 66 50 L 74 32 L 84 42 L 100 18 L 116 42 L 126 32 L 134 50 Q 100 42 66 50 Z" {...SILVER} />
        <circle cx={100} cy={36} r={5.5} fill="#ff5ea8" stroke="#c23d80" strokeWidth={1.5} />
        <circle cx={98.5} cy={34.5} r={1.6} fill="#fff" />
        <circle cx={79} cy={42} r={3} fill="#74b9ff" stroke="#3f7fd8" strokeWidth={1.2} />
        <circle cx={121} cy={42} r={3} fill="#74b9ff" stroke="#3f7fd8" strokeWidth={1.2} />
        <circle cx={100} cy={16} r={3} fill="#fff" stroke="#8e9ab3" strokeWidth={1.2} />
        <circle cx={74} cy={30} r={2.4} fill="#fff" stroke="#8e9ab3" strokeWidth={1.2} />
        <circle cx={126} cy={30} r={2.4} fill="#fff" stroke="#8e9ab3" strokeWidth={1.2} />
      </>
    ),
  },
  'unicorn-horn': {
    thumb: '40 -30 120 100',
    main: () => (
      <>
        <path d="M 52 72 C 54 42 76 30 100 30 C 124 30 146 42 148 72" fill="none" stroke="#e56fb6" strokeWidth={6} strokeLinecap="round" />
        <path d="M 52 72 C 54 42 76 30 100 30 C 124 30 146 42 148 72" fill="none" stroke="#ff9fd6" strokeWidth={3} strokeLinecap="round" />
        <Mirror>
          <path d="M 70 40 C 62 28 62 18 66 10 C 76 14 82 24 82 34 Z" fill="#fff" stroke="#d6b6e8" strokeWidth={2} />
          <path d="M 70 33 C 67 26 67 20 68 16 C 73 19 76 25 77 31 Z" fill="#ffc6e5" />
        </Mirror>
        <path d="M 89 36 L 100 -16 L 111 36 Z" {...GOLD} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${90.5 + i * 2.4} ${29 - i * 12} Q 100 ${33 - i * 12} ${109.5 - i * 2.4} ${25 - i * 12}`} fill="none" stroke="#e0a800" strokeWidth={1.8} />
        ))}
        <circle cx={84} cy={38} r={6} fill="#c9a8ff" stroke="#9b5de5" strokeWidth={1.5} />
        <circle cx={116} cy={38} r={6} fill="#ff8fd8" stroke="#e0559c" strokeWidth={1.5} />
        <circle cx={84} cy={38} r={2} fill="#ffd93d" />
        <circle cx={116} cy={38} r={2} fill="#ffd93d" />
      </>
    ),
  },
  crown: {
    thumb: '40 -20 120 90',
    main: () => (
      <>
        <path d="M 64 48 L 60 12 L 80 28 L 100 0 L 120 28 L 140 12 L 136 48 Q 100 40 64 48 Z" {...GOLD} />
        <path d="M 64 40 Q 100 32 136 40" fill="none" stroke="#c98a00" strokeWidth={1.8} />
        <circle cx={60} cy={11} r={4} {...GOLD} />
        <circle cx={100} cy={-1} r={4.5} {...GOLD} />
        <circle cx={140} cy={11} r={4} {...GOLD} />
        <ellipse cx={100} cy={30} rx={5.5} ry={6.5} fill="#ff5e7e" stroke="#c2304f" strokeWidth={1.5} />
        <circle cx={79} cy={36} r={4} fill="#4d96ff" stroke="#2f62c4" strokeWidth={1.5} />
        <circle cx={121} cy={36} r={4} fill="#3fc97a" stroke="#1f9a55" strokeWidth={1.5} />
        <circle cx={98.3} cy={28} r={1.8} fill="#fff" />
        <path d="M 70 20 L 72 38" stroke="#fff6c4" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      </>
    ),
  },

  // Face
  glasses: {
    main: (p) => (
      <g fill="none" strokeLinecap="round">
        <Mirror>
          <circle cx={80} cy={99} r={13.5} fill="#fff" fillOpacity={0.18} stroke={p.dark} strokeWidth={5} />
          <circle cx={80} cy={99} r={13.5} stroke={p.base} strokeWidth={2.5} />
          <path d="M 66.5 96 L 52 92" stroke={p.dark} strokeWidth={3.5} />
          <path d="M 72 92 Q 75 88 79 88" stroke="#fff" strokeWidth={2} opacity={0.8} />
        </Mirror>
        <path d="M 93.5 97 Q 100 93 106.5 97" stroke={p.dark} strokeWidth={3.5} />
      </g>
    ),
  },
  'star-stickers': {
    main: () => (
      <>
        <path d={starPath(64, 115, 6)} fill="#ffd93d" stroke="#e0a800" strokeWidth={1.2} strokeLinejoin="round" />
        <path d={starPath(72, 123, 3.5)} fill="#ff8fd8" />
        <path d={starPath(136, 115, 6)} fill="#ffd93d" stroke="#e0a800" strokeWidth={1.2} strokeLinejoin="round" />
        <path d={starPath(128, 123, 3.5)} fill="#74b9ff" />
        <circle cx={142} cy={108} r={1.6} fill="#fff" stroke="#e0a800" strokeWidth={0.8} />
        <circle cx={58} cy={108} r={1.6} fill="#fff" stroke="#e0a800" strokeWidth={0.8} />
      </>
    ),
  },
  sunglasses: {
    main: (p) => (
      <>
        <Mirror>
          <path d="M 64 90 Q 64 88 67 88 L 93 88 Q 96 88 95 92 L 93 104 Q 91 112 80 112 Q 68 112 66 104 Z" fill="#3b2a5c" stroke={p.base} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M 70 94 L 78 94 M 70 99 L 74 99" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.55} />
          <path d="M 64 92 L 51 90" stroke={p.base} strokeWidth={3.5} strokeLinecap="round" />
        </Mirror>
        <path d="M 95 92 Q 100 89 105 92" fill="none" stroke={p.base} strokeWidth={3.5} strokeLinecap="round" />
      </>
    ),
  },
  'heart-glasses': {
    main: (p) => (
      <>
        <Mirror>
          <path d={heartPath(80, 100, 13)} fill={p.base} fillOpacity={0.35} stroke={p.dark} strokeWidth={5} strokeLinejoin="round" />
          <path d={heartPath(80, 100, 13)} fill="none" stroke={p.base} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M 64 96 L 51 92" stroke={p.dark} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M 71 92 Q 73 89 76 90" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        </Mirror>
        <path d="M 94 95 Q 100 92 106 95" fill="none" stroke={p.dark} strokeWidth={3.5} strokeLinecap="round" />
      </>
    ),
  },

  // Tops
  tshirt: top((p) => sleeve(p, 0.36)),
  striped: top(
    (p) => (
      <>
        {sleeve(p, 0.86)}
        <Mirror>
          <path d={`M ${ARM.from[0]} ${ARM.from[1]} L ${along(ARM.from, ARM.to, 0.86).join(' ')}`} stroke="url(#stripes)" strokeWidth={ARM_WIDTH + 5} strokeLinecap="round" />
        </Mirror>
      </>
    ),
    () => <path d={TORSO} fill="url(#stripes)" />,
  ),
  'heart-shirt': top(
    (p) => sleeve(p, 0.36),
    (p) => (
      <>
        <path d={heartPath(100, 182, 14)} fill={contrast(p)} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M 91 176 Q 93 172 97 173" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </>
    ),
  ),
  hoodie: {
    main: (p, skin) => (
      <>
        {sleeve(p, 0.84)}
        <path d={TORSO} {...line(p)} />
        <path d="M 78 158 C 74 140 88 134 100 136 C 112 134 126 140 122 158 C 116 150 108 148 100 160 C 92 148 84 150 78 158 Z" {...outline(p.light, p.dark)} />
        <path d="M 90 150 Q 100 162 110 150 Z" fill={skin.base} stroke={skin.dark} strokeWidth={1.5} />
        <path d="M 82 190 L 118 190 L 122 210 Q 100 214 78 210 Z" {...line(p, 2)} />
        <path d="M 95 158 L 93 178 M 105 158 L 107 178" stroke={p.dark} strokeWidth={2} strokeLinecap="round" />
        <circle cx={93} cy={180} r={2.5} fill={p.light} stroke={p.dark} strokeWidth={1.2} />
        <circle cx={107} cy={180} r={2.5} fill={p.light} stroke={p.dark} strokeWidth={1.2} />
        <Mirror>
          <path d={`M ${along(ARM.from, ARM.to, 0.8).join(' ')} L ${along(ARM.from, ARM.to, 0.84).join(' ')}`} stroke={p.light} strokeWidth={ARM_WIDTH + 3} strokeLinecap="round" />
        </Mirror>
      </>
    ),
  },
  'glitter-top': {
    main: (p, skin) => (
      <>
        {puffSleeve(p)}
        <path d={TORSO} {...line(p)} />
        <path d={TORSO} fill="url(#glitter)" />
        <path d="M 74 206 Q 100 212 126 206" fill="none" stroke={p.light} strokeWidth={3} strokeLinecap="round" />
        <path d="M 89 150 Q 100 164 111 150 Z" fill={skin.base} stroke={p.light} strokeWidth={2.5} />
        <path d={starPath(100, 184, 9)} fill="#fff" stroke={p.dark} strokeWidth={1.5} strokeLinejoin="round" />
      </>
    ),
  },
  'rainbow-shirt': top(
    () => sleeve({ base: '#ffffff', dark: '#c9bfd9', light: '#fff' }, 0.36),
    () => (
      <>
        <path d={TORSO} {...outline('#ffffff', '#c9bfd9')} />
        {RAINBOW_STOPS.map((c, i) => (
          <path key={c} d={`M ${82 + i * 3} 196 A ${18 - i * 3} ${18 - i * 3} 0 0 1 ${118 - i * 3} 196`} fill="none" stroke={c} strokeWidth={3.4} />
        ))}
        <ellipse cx={83} cy={197} rx={6} ry={3.5} fill="#fff" stroke="#c9bfd9" strokeWidth={1.2} />
        <ellipse cx={117} cy={197} rx={6} ry={3.5} fill="#fff" stroke="#c9bfd9" strokeWidth={1.2} />
      </>
    ),
  ),

  // Bottoms
  trousers: {
    main: (p) => (
      <>
        <path d={TROUSERS} {...line(p)} />
        <path d="M 100 206 L 100 222" stroke={p.dark} strokeWidth={2} />
      </>
    ),
  },
  shorts: {
    main: (p) => (
      <>
        <path d="M 76 203 L 124 203 L 126 228 L 102 228 L 100 216 L 98 228 L 74 228 Z" {...line(p)} />
        <path d="M 75 223 L 98 223 M 102 223 L 125 223" stroke={p.dark} strokeWidth={1.6} opacity={0.6} />
      </>
    ),
  },
  skirt: {
    main: (p) => (
      <>
        <path d={SKIRT} {...line(p)} />
        <path d="M 88 206 L 84 240 M 100 206 L 100 241 M 112 206 L 116 240" stroke={p.dark} strokeWidth={1.6} opacity={0.55} />
      </>
    ),
  },
  jeans: {
    main: () => (
      <>
        <path d={TROUSERS} fill="url(#denim)" stroke="#3a64a8" strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M 100 206 L 100 222" stroke="#3a64a8" strokeWidth={2} />
        <path d="M 80 208 Q 86 214 92 208 M 108 208 Q 114 214 120 208" fill="none" stroke="#ffd27a" strokeWidth={1.4} strokeDasharray="2 2" />
        <rect x={75} y={244} width={24} height={8} rx={2} fill="#8db4ea" stroke="#3a64a8" strokeWidth={2} />
        <rect x={101} y={244} width={24} height={8} rx={2} fill="#8db4ea" stroke="#3a64a8" strokeWidth={2} />
      </>
    ),
  },
  tutu: {
    main: (p) => (
      <>
        <path d="M 74 203 Q 100 198 126 203 L 146 228 Q 136 236 128 230 Q 120 238 112 231 Q 104 239 96 231 Q 88 238 80 230 Q 70 236 54 228 Z" fill={p.base} fillOpacity={0.75} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M 76 204 Q 100 200 124 204 L 138 222 Q 130 228 122 223 Q 114 229 106 224 Q 100 229 94 224 Q 86 229 78 223 Q 70 228 62 222 Z" fill={p.light} fillOpacity={0.8} stroke={p.dark} strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M 76 202 Q 100 197 124 202 L 124 208 Q 100 204 76 208 Z" {...line(p, 2)} />
        <circle cx={70} cy={224} r={1.5} fill="#fff" />
        <circle cx={128} cy={220} r={1.5} fill="#fff" />
        <circle cx={100} cy={226} r={1.5} fill="#fff" />
      </>
    ),
  },

  // Dresses (instead of a top and a bottom)
  'summer-dress': {
    main: (p, skin) => (
      <>
        <path d="M 78 162 Q 100 168 122 162 L 123 198 L 140 242 Q 100 250 60 242 L 77 198 Z" {...line(p)} />
        <path d="M 78 162 Q 100 168 122 162 L 123 198 L 140 242 Q 100 250 60 242 L 77 198 Z" fill="url(#dots)" />
        <path d="M 77 198 Q 100 203 123 198" fill="none" stroke={p.dark} strokeWidth={2} />
        <path d="M 84 151 L 85 164 M 116 151 L 115 164" stroke={p.dark} strokeWidth={4.5} strokeLinecap="round" />
        <path d="M 84 151 L 85 164 M 116 151 L 115 164" stroke={p.base} strokeWidth={2} strokeLinecap="round" />
        <path d="M 92 151 Q 100 156 108 151" fill="none" stroke={skin.dark} strokeWidth={1.5} />
      </>
    ),
  },
  'party-dress': {
    main: (p, skin) => (
      <>
        {puffSleeve(p)}
        <path d="M 76 200 L 124 200 L 146 240 Q 136 248 124 242 Q 112 250 100 243 Q 88 250 76 242 Q 64 248 54 240 Z" {...line(p)} />
        <path d="M 88 203 L 80 240 M 100 203 L 100 242 M 112 203 L 120 240" stroke={p.dark} strokeWidth={1.5} opacity={0.4} />
        {bodice(p, skin)}
        <path d="M 75 196 Q 100 202 125 196 L 125 204 Q 100 210 75 204 Z" fill={p.light} stroke={p.dark} strokeWidth={2} />
        <path d="M 100 200 C 90 190 82 196 84 203 C 86 210 94 206 100 200 C 106 194 114 190 116 197 C 118 204 110 208 100 200 Z" fill={p.light} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={100} cy={200} r={3.5} fill={p.base} stroke={p.dark} strokeWidth={1.5} />
      </>
    ),
  },
  'princess-dress': {
    main: (p, skin) => (
      <>
        {puffSleeve(p)}
        <path d="M 78 196 C 64 220 50 246 42 260 Q 100 272 158 260 C 150 246 136 220 122 196 Z" {...line(p)} />
        <path d="M 92 200 C 86 224 80 246 76 266 Q 100 270 124 266 C 120 246 114 224 108 200 Z" fill={p.light} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M 92 200 C 86 224 80 246 76 266 Q 100 270 124 266 C 120 246 114 224 108 200 Z" fill="url(#glitter)" />
        <path d="M 44 258 Q 72 266 100 266 Q 128 266 156 258" fill="none" stroke="#ffd23f" strokeWidth={3} strokeLinecap="round" />
        <path d={BODICE.replace('L 124 203 L 76 203', 'L 123 196 L 100 208 L 77 196')} {...line(p)} />
        {neckline(skin)}
        <path d="M 77 196 L 100 208 L 123 196" fill="none" stroke="#ffd23f" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <path d={heartPath(100, 172, 5)} fill="#ffd23f" stroke="#c98a00" strokeWidth={1.2} />
        {[
          [66, 240],
          [134, 240],
          [56, 254],
          [144, 254],
          [80, 224],
          [120, 224],
        ].map(([x, y]) => (
          <path key={`${x}-${y}`} d={starPath(x, y, 3.2)} fill="#fff" opacity={0.9} />
        ))}
      </>
    ),
  },
  'rainbow-dress': {
    main: (_p, skin) => {
      const p = { base: '#ffffff', dark: '#b9a9d9', light: '#ffffff' };
      return (
        <>
          {puffSleeve(p)}
          <path d="M 76 198 L 124 198 L 144 246 Q 100 254 56 246 Z" fill="url(#rainbow-skirt)" stroke={p.dark} strokeWidth={2.5} strokeLinejoin="round" />
          {bodice(p, skin)}
          <path d="M 76 196 Q 100 201 124 196 L 124 203 Q 100 208 76 203 Z" fill="#9b5de5" stroke="#7a3fc4" strokeWidth={2} />
          <path d={starPath(100, 177, 7)} fill="#ffd93d" stroke="#e0a800" strokeWidth={1.4} strokeLinejoin="round" />
        </>
      );
    },
  },

  // Shoes
  sneakers: { main: sneaker },
  'ballet-flats': {
    main: (p) => flat(p, <path d="M 82 251 Q 86 247 86 251 Q 86 247 90 251 Q 86 254 82 251 Z" fill={p.light} stroke={p.dark} strokeWidth={1.4} />),
  },
  boots: {
    main: (p) => (
      <Mirror>
        <path d="M 79 222 L 100 222 L 100 252 C 101 256 101 262 98 264 L 74 264 C 70 264 70 256 76 252 L 79 248 Z" {...line(p)} />
        <path d="M 78 222 L 101 222 L 101 230 L 78 230 Z" fill={p.light} stroke={p.dark} strokeWidth={2} />
        <rect x={71} y={259} width={30} height={6} rx={3} fill={p.dark} />
      </Mirror>
    ),
  },
  'glitter-shoes': {
    main: () =>
      flat(
        { base: '#ffb3e0', dark: '#e0559c', light: '#ffe0f2' },
        <>
          <path d="M 73 258 C 72 251 79 248 86 248 C 93 248 100 251 99 258 C 99 263 93 264 86 264 C 79 264 73 263 73 258 Z" fill="url(#glitter)" />
          <path d={starPath(86, 252, 4)} fill="#ffd93d" stroke="#e0a800" strokeWidth={1} />
        </>,
      ),
  },
  'roller-skates': {
    thumb: '60 210 80 75',
    main: (p) => (
      <Mirror>
        <path d="M 78 230 L 99 230 L 100 254 L 101 262 L 72 262 C 70 256 74 252 78 250 Z" {...line(p)} />
        <path d="M 82 236 L 96 240 M 82 242 L 96 246" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        <rect x={70} y={260} width={33} height={6} rx={3} fill="#fff" stroke="#c9bfd9" strokeWidth={1.8} />
        <circle cx={77} cy={271} r={5} fill="#ffd93d" stroke="#e0a800" strokeWidth={2} />
        <circle cx={96} cy={271} r={5} fill="#ffd93d" stroke="#e0a800" strokeWidth={2} />
        <circle cx={68} cy={262} r={3} fill="#ff5e7e" />
      </Mirror>
    ),
  },

  // Around the neck
  scarf: {
    main: (p) => (
      <>
        <path d="M 112 152 C 118 166 116 184 120 196 L 108 198 C 106 186 104 170 102 160 Z" {...line(p)} />
        <path d="M 109 197 L 108 204 M 113 197 L 113 204 M 117 196 L 118 203" stroke={p.dark} strokeWidth={2} strokeLinecap="round" />
        <path d="M 80 148 Q 100 140 120 148 Q 124 156 118 162 Q 100 168 82 162 Q 76 156 80 148 Z" {...line(p)} />
        <path d="M 84 152 Q 100 147 116 152" fill="none" stroke={p.light} strokeWidth={3} strokeLinecap="round" />
      </>
    ),
  },
  pearls: {
    main: () => (
      <>
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (0.05 + (0.9 * i) / 10);
          return <circle key={i} cx={100 + Math.cos(a) * 15} cy={150 + Math.sin(a) * 15} r={3.4} fill="url(#pearl)" stroke="#c7b6dd" strokeWidth={1} />;
        })}
      </>
    ),
  },
  'heart-necklace': {
    main: () => (
      <>
        <path d="M 86 151 Q 88 166 100 170 Q 112 166 114 151" fill="none" stroke="#e0a800" strokeWidth={1.8} />
        <path d={heartPath(100, 175, 7)} fill="#ff5e9c" stroke="#c98a00" strokeWidth={2} strokeLinejoin="round" />
        <path d="M 95.5 172 Q 97 169.5 99 170.5" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
      </>
    ),
  },

  // On her back
  backpack: {
    thumb: '50 140 100 80',
    back: (p) => (
      <>
        <rect x={62} y={154} width={76} height={56} rx={14} {...line(p)} />
        <rect x={64} y={186} width={72} height={20} rx={8} fill={p.light} stroke={p.dark} strokeWidth={2} />
      </>
    ),
    over: (p) => (
      <Mirror>
        <path d="M 84 151 C 80 166 80 184 82 200" fill="none" stroke={p.dark} strokeWidth={8} strokeLinecap="round" />
        <path d="M 84 151 C 80 166 80 184 82 200" fill="none" stroke={p.base} strokeWidth={4.5} strokeLinecap="round" />
      </Mirror>
    ),
  },
  cape: {
    thumb: '30 130 140 140',
    back: (p) => (
      <>
        <path d="M 78 152 C 62 186 50 226 42 256 Q 70 266 100 262 Q 130 266 158 256 C 150 226 138 186 122 152 Z" {...line(p)} />
        <path d="M 82 160 C 70 194 62 228 58 254 M 118 160 C 130 194 138 228 142 254" fill="none" stroke={p.dark} strokeWidth={2} opacity={0.35} />
      </>
    ),
    over: (p) => (
      <>
        <path d="M 82 151 Q 100 162 118 151" fill="none" stroke={p.dark} strokeWidth={6} strokeLinecap="round" />
        <path d="M 82 151 Q 100 162 118 151" fill="none" stroke={p.base} strokeWidth={3} strokeLinecap="round" />
        <circle cx={100} cy={157} r={5} {...GOLD} />
      </>
    ),
  },
  'fairy-wings': {
    thumb: '0 80 200 160',
    back: () => (
      <g stroke="#b892e8" strokeWidth={2} strokeLinejoin="round" fill="url(#wing)">
        <Mirror>
          <path d="M 92 168 C 70 128 34 102 18 112 C 6 122 14 160 40 176 C 58 186 80 180 92 172 Z" />
          <path d="M 92 176 C 74 186 48 200 44 220 C 42 234 58 238 70 228 C 82 218 90 196 94 180 Z" />
          <path d="M 86 168 C 66 146 44 128 28 122 M 88 180 C 74 196 62 212 56 226" fill="none" stroke="#fff" strokeWidth={2} opacity={0.7} />
          <circle cx={36} cy={138} r={2.5} fill="#fff" stroke="none" />
          <circle cx={58} cy={212} r={2} fill="#fff" stroke="none" />
        </Mirror>
      </g>
    ),
  },
  'rainbow-wings': {
    thumb: '0 70 200 160',
    back: () => (
      <Mirror>
        {RAINBOW_STOPS.map((c, i) => {
          const s = 1 - i * 0.12;
          return (
            <path
              key={c}
              transform={`translate(${92 * (1 - s)} ${166 * (1 - s)}) scale(${s})`}
              d="M 92 166 C 66 126 30 92 8 98 C 4 112 12 128 24 136 C 10 140 8 152 20 160 C 10 168 14 182 30 184 C 26 196 38 204 52 198 C 64 194 82 184 94 174 Z"
              fill={c}
              stroke="#fff"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          );
        })}
      </Mirror>
    ),
  },

  // In her hand
  lollipop: {
    main: (_p, skin) => (
      <>
        {stick(150, 166)}
        <circle cx={152} cy={160} r={13} fill="#ff8fd8" stroke="#e0559c" strokeWidth={2} />
        <path d="M 152 160 m -9 0 a 9 9 0 0 1 9 -9 a 7 7 0 0 1 7 7 a 5 5 0 0 1 -5 5 a 3 3 0 0 1 -3 -3" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
        {fist(skin)}
      </>
    ),
  },
  balloon: {
    thumb: '120 40 70 180',
    main: (p, skin) => (
      <>
        <path d={`M ${HX} ${HY} C 150 180 168 150 166 118`} fill="none" stroke="#9b8fb5" strokeWidth={1.6} />
        <path d="M 166 118 L 162 124 L 170 124 Z" {...line(p, 1.6)} />
        <ellipse cx={166} cy={94} rx={19} ry={24} {...line(p)} />
        <ellipse cx={159} cy={84} rx={4} ry={7} fill="#fff" opacity={0.55} transform="rotate(20 159 84)" />
        {fist(skin)}
      </>
    ),
  },
  'ice-cream': {
    main: (_p, skin) => (
      <>
        <path d="M 127 196 L 145 196 L 136 224 Z" fill="#f2b96b" stroke="#c98a3a" strokeWidth={2} strokeLinejoin="round" />
        <path d="M 130 202 L 142 202 M 132 209 L 140 209" stroke="#c98a3a" strokeWidth={1.4} />
        <circle cx={136} cy={188} r={10} fill="#ff9fd6" stroke="#e0559c" strokeWidth={2} />
        <circle cx={136} cy={175} r={8.5} fill="#8be3c8" stroke="#3fb596" strokeWidth={2} />
        <path d="M 132 172 Q 134 169 138 170" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        <circle cx={137} cy={166} r={3} fill="#ff5e7e" />
        {fist(skin)}
      </>
    ),
  },
  teddy: {
    thumb: '115 150 65 80',
    main: (_p, skin) => {
      const fur = { fill: '#c98f5a', stroke: '#8f5d33', strokeWidth: 2 };
      return (
        <g>
          <circle cx={140} cy={164} r={5} {...fur} />
          <circle cx={160} cy={164} r={5} {...fur} />
          <ellipse cx={150} cy={198} rx={12} ry={14} {...fur} />
          <circle cx={150} cy={175} r={11} {...fur} />
          <ellipse cx={150} cy={179} rx={5} ry={4} fill="#f2d2b0" />
          <circle cx={146} cy={173} r={1.6} fill={INK} />
          <circle cx={154} cy={173} r={1.6} fill={INK} />
          <circle cx={150} cy={178} r={1.4} fill={INK} />
          <ellipse cx={150} cy={200} rx={6} ry={7} fill="#f2d2b0" />
          <circle cx={160} cy={210} r={4.5} {...fur} />
          <path d="M 144 186 L 150 190 L 156 186" fill="none" stroke="#ff5e7e" strokeWidth={3} strokeLinecap="round" />
          {fist(skin)}
        </g>
      );
    },
  },
  wand: {
    thumb: '115 130 70 90',
    main: (_p, skin) => (
      <>
        {stick(154, 160, '#9b5de5', '#6a35b8')}
        <path d={starPath(156, 154, 13)} {...GOLD} />
        <circle cx={152} cy={150} r={2} fill="#fff" />
        <path d={starPath(172, 140, 3.5)} fill="#ff8fd8" />
        <path d={starPath(142, 138, 2.8)} fill="#74b9ff" />
        <circle cx={168} cy={160} r={1.6} fill="#ffd93d" />
        {fist(skin)}
      </>
    ),
  },
};
