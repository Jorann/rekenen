import type { ReactNode } from 'react';
import { starPath } from './draw.tsx';

/**
 * Her pets, sitting, in their own viewBox (0 0 120 120, ground at y = 112).
 * They sit next to her in the wardrobe and walk around in the garden.
 */
export const PET_VIEWBOX = '0 0 120 120';

const INK = '#2f2440';

function eyes(y: number, left: number, right: number, size = 5): ReactNode {
  return (
    <>
      {[left, right].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={size} ry={size * 1.15} fill={INK} />
          <circle cx={x + size * 0.35} cy={y - size * 0.45} r={size * 0.42} fill="#fff" />
        </g>
      ))}
    </>
  );
}

function cheeks(y: number, left: number, right: number): ReactNode {
  return (
    <>
      <ellipse cx={left} cy={y} rx={5} ry={3} fill="#ff7a9c" opacity={0.45} />
      <ellipse cx={right} cy={y} rx={5} ry={3} fill="#ff7a9c" opacity={0.45} />
    </>
  );
}

const PETS: Record<string, () => ReactNode> = {
  bunny: () => {
    const fur = { fill: '#ffffff', stroke: '#c9bcd9', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    return (
      <>
        <ellipse cx={60} cy={114} rx={30} ry={5} fill="rgba(80,40,120,0.12)" />
        <path d="M 44 46 C 36 26 36 6 44 4 C 52 2 56 24 54 44 Z" {...fur} />
        <path d="M 76 46 C 84 26 84 6 76 4 C 68 2 64 24 66 44 Z" {...fur} />
        <path d="M 46 40 C 42 26 42 14 45 10 C 49 12 51 26 51 40 Z" fill="#ffc6e0" />
        <path d="M 74 40 C 78 26 78 14 75 10 C 71 12 69 26 69 40 Z" fill="#ffc6e0" />
        <ellipse cx={60} cy={92} rx={26} ry={22} {...fur} />
        <ellipse cx={60} cy={60} rx={25} ry={22} {...fur} />
        {eyes(58, 50, 70, 4.2)}
        {cheeks(67, 44, 76)}
        <path d="M 57 64 Q 60 67 63 64 Q 60 62 57 64 Z" fill="#ff8fb5" />
        <path d="M 60 66 L 60 69 M 56 70 Q 60 73 64 70" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <ellipse cx={45} cy={110} rx={10} ry={6} {...fur} />
        <ellipse cx={75} cy={110} rx={10} ry={6} {...fur} />
        <ellipse cx={60} cy={95} rx={12} ry={11} fill="#fff5fa" />
      </>
    );
  },
  kitten: () => {
    const fur = { fill: '#ffb86b', stroke: '#d9822b', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    return (
      <>
        <ellipse cx={60} cy={114} rx={32} ry={5} fill="rgba(80,40,120,0.12)" />
        <path d="M 82 104 C 104 104 108 84 100 74 C 96 70 92 74 96 80 C 100 88 94 96 80 96 Z" {...fur} />
        <ellipse cx={60} cy={92} rx={24} ry={21} {...fur} />
        <ellipse cx={60} cy={96} rx={12} ry={13} fill="#fff1df" />
        <path d="M 36 50 L 38 20 L 58 36 Z" {...fur} />
        <path d="M 84 50 L 82 20 L 62 36 Z" {...fur} />
        <path d="M 41 42 L 42 28 L 52 36 Z" fill="#ffc6d6" />
        <path d="M 79 42 L 78 28 L 68 36 Z" fill="#ffc6d6" />
        <ellipse cx={60} cy={56} rx={28} ry={23} {...fur} />
        <path d="M 54 35 L 55 42 M 60 34 L 60 42 M 66 35 L 65 42" stroke="#d9822b" strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx={60} cy={66} rx={11} ry={7} fill="#fff1df" />
        {eyes(56, 49, 71, 4.6)}
        {cheeks(66, 41, 79)}
        <path d="M 57 62 L 63 62 L 60 65.5 Z" fill="#ff8fb5" stroke="#e0559c" strokeWidth={1} strokeLinejoin="round" />
        <path d="M 60 66 Q 57 70 54 68 M 60 66 Q 63 70 66 68" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M 40 63 L 28 61 M 40 67 L 28 69 M 80 63 L 92 61 M 80 67 L 92 69" stroke="#b07a52" strokeWidth={1.4} strokeLinecap="round" />
        <ellipse cx={48} cy={110} rx={9} ry={6} {...fur} />
        <ellipse cx={72} cy={110} rx={9} ry={6} {...fur} />
      </>
    );
  },
  puppy: () => {
    const fur = { fill: '#f3d6ad', stroke: '#c49563', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    const ear = { fill: '#9c6644', stroke: '#6e4428', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    return (
      <>
        <ellipse cx={60} cy={114} rx={32} ry={5} fill="rgba(80,40,120,0.12)" />
        <path d="M 84 100 C 96 98 100 86 96 80" fill="none" stroke="#c49563" strokeWidth={9} strokeLinecap="round" />
        <path d="M 84 100 C 96 98 100 86 96 80" fill="none" stroke="#f3d6ad" strokeWidth={4.5} strokeLinecap="round" />
        <ellipse cx={60} cy={92} rx={25} ry={21} {...fur} />
        <ellipse cx={60} cy={95} rx={12} ry={12} fill="#fff6ea" />
        <ellipse cx={60} cy={56} rx={28} ry={25} {...fur} />
        <path d="M 74 40 C 86 44 90 52 84 58 C 80 54 76 50 74 40 Z" fill="#c9965e" opacity={0.6} />
        <path d="M 36 38 C 22 40 20 64 30 72 C 38 68 40 54 40 42 Z" {...ear} />
        <path d="M 84 38 C 98 40 100 64 90 72 C 82 68 80 54 80 42 Z" {...ear} />
        <ellipse cx={60} cy={67} rx={13} ry={9} fill="#fff6ea" />
        {eyes(54, 49, 71, 4.6)}
        {cheeks(65, 42, 78)}
        <ellipse cx={60} cy={62} rx={5} ry={3.5} fill={INK} />
        <path d="M 60 65 L 60 68 M 54 68 Q 60 72 66 68" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M 57 70 Q 60 78 63 70 Z" fill="#ff7a9c" stroke="#e0559c" strokeWidth={1} />
        <path d="M 40 80 Q 60 88 80 80" fill="none" stroke="#ff5e7e" strokeWidth={4} strokeLinecap="round" />
        <circle cx={60} cy={86} r={3.5} fill="#ffd93d" stroke="#e0a800" strokeWidth={1.2} />
        <ellipse cx={48} cy={110} rx={9} ry={6} {...fur} />
        <ellipse cx={72} cy={110} rx={9} ry={6} {...fur} />
      </>
    );
  },
  dragon: () => {
    const scale = { fill: '#6fd39a', stroke: '#2f9c63', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    return (
      <>
        <ellipse cx={60} cy={114} rx={34} ry={5} fill="rgba(80,40,120,0.12)" />
        <path d="M 80 104 C 100 106 108 96 106 84 L 112 80 L 104 76 L 100 82 C 102 92 96 98 82 96 Z" {...scale} />
        <path d="M 40 76 C 20 60 12 70 14 84 C 20 80 26 84 28 88 C 32 84 38 86 40 90 Z" fill="#c9a8ff" stroke="#8a5fd6" strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M 80 76 C 100 60 108 70 106 84 C 100 80 94 84 92 88 C 88 84 82 86 80 90 Z" fill="#c9a8ff" stroke="#8a5fd6" strokeWidth={2.2} strokeLinejoin="round" />
        <ellipse cx={60} cy={92} rx={24} ry={21} {...scale} />
        <ellipse cx={60} cy={96} rx={13} ry={14} fill="#fff3b0" stroke="#e8c840" strokeWidth={1.5} />
        <path d="M 50 90 L 70 90 M 49 97 L 71 97 M 51 104 L 69 104" stroke="#e8c840" strokeWidth={1.4} />
        <path d="M 44 34 L 40 18 L 52 30 Z" fill="#fff3b0" stroke="#e0a800" strokeWidth={2} strokeLinejoin="round" />
        <path d="M 76 34 L 80 18 L 68 30 Z" fill="#fff3b0" stroke="#e0a800" strokeWidth={2} strokeLinejoin="round" />
        <ellipse cx={60} cy={54} rx={27} ry={23} {...scale} />
        <path d="M 56 31 L 60 25 L 64 31" fill="#c9a8ff" stroke="#8a5fd6" strokeWidth={1.8} strokeLinejoin="round" />
        <ellipse cx={60} cy={66} rx={14} ry={9} fill="#9be6b8" />
        {eyes(52, 49, 71, 5)}
        {cheeks(62, 42, 78)}
        <circle cx={55} cy={64} r={1.6} fill="#2f9c63" />
        <circle cx={65} cy={64} r={1.6} fill="#2f9c63" />
        <path d="M 52 69 Q 60 75 68 69" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
        <ellipse cx={47} cy={110} rx={9} ry={6} {...scale} />
        <ellipse cx={73} cy={110} rx={9} ry={6} {...scale} />
      </>
    );
  },
  unicorn: () => {
    const coat = { fill: '#ffffff', stroke: '#cdbbe3', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    const mane = ['#ff8fd8', '#c9a8ff', '#74b9ff', '#8be3c8'];
    return (
      <>
        <ellipse cx={60} cy={114} rx={34} ry={5} fill="rgba(80,40,120,0.12)" />
        {mane.map((c, i) => (
          <path key={c} d={`M ${84 + i * 3} ${92 - i * 2} C ${104 + i * 2} ${96 - i * 4} ${108 - i} ${80 - i * 4} ${98 - i * 2} ${70 - i * 3}`} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />
        ))}
        <ellipse cx={60} cy={93} rx={25} ry={20} {...coat} />
        <rect x={42} y={98} width={11} height={14} rx={5} {...coat} />
        <rect x={67} y={98} width={11} height={14} rx={5} {...coat} />
        <rect x={42} y={106} width={11} height={7} rx={3} fill="#c9a8ff" stroke="#9b7ad6" strokeWidth={1.5} />
        <rect x={67} y={106} width={11} height={7} rx={3} fill="#c9a8ff" stroke="#9b7ad6" strokeWidth={1.5} />
        <path d="M 42 40 L 40 24 L 52 34 Z" {...coat} />
        <path d="M 78 40 L 80 24 L 68 34 Z" {...coat} />
        {mane.map((c, i) => (
          <circle key={c} cx={[78, 86, 89, 87][i]} cy={[34, 42, 53, 64][i]} r={9 - i * 0.6} fill={c} />
        ))}
        <ellipse cx={60} cy={56} rx={26} ry={23} {...coat} />
        <path d="M 54 34 L 60 2 L 66 34 Z" fill="url(#gold)" stroke="#c98a00" strokeWidth={2} strokeLinejoin="round" />
        <path d="M 55.5 27 Q 60 29 64.5 25 M 57 18 Q 60 20 63 16 M 58 10 Q 60 11 61.6 9" fill="none" stroke="#c98a00" strokeWidth={1.4} />
        <path d="M 48 36 C 52 30 58 30 60 34 C 56 34 52 36 48 40 Z" fill="#ff8fd8" />
        <ellipse cx={60} cy={68} rx={13} ry={8} fill="#ffe3f1" stroke="#f0b6d6" strokeWidth={1.5} />
        <circle cx={55} cy={67} r={1.5} fill="#d982b0" />
        <circle cx={65} cy={67} r={1.5} fill="#d982b0" />
        {eyes(53, 49, 71, 4.8)}
        <path d="M 44 48 L 41 46 M 76 48 L 79 46" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        {cheeks(63, 42, 78)}
        <path d="M 55 72 Q 60 75 65 72" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <path d={starPath(22, 30, 5)} fill="#ffd93d" />
        <path d={starPath(100, 20, 3.5)} fill="#ff8fd8" />
        <circle cx={14} cy={60} r={2} fill="#c9a8ff" />
      </>
    );
  },
};

export function hasPetDrawing(id: string): boolean {
  return id in PETS;
}

export function Pet({ id, className }: { id: string; className?: string }) {
  const draw = PETS[id];
  if (!draw) return null;
  return (
    <svg className={`pet${className ? ` ${className}` : ''}`} viewBox={PET_VIEWBOX} aria-hidden="true">
      {draw()}
    </svg>
  );
}
