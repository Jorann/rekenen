import { WEARABLES } from './clothes.tsx';
import { ARM, ARM_WIDTH, HAND, Limb, Mirror } from './draw.tsx';
import { HAIR } from './hair.tsx';
import { colorOf, HAIR_COLORS, paint, shade, type HairPaint, type Look, type WornSlot } from './look.ts';

export type Mood = 'happy' | 'joy';

/** The avatar's coordinate space; hats and wings reach above and beside the body. */
export const AVATAR_VIEWBOX = '0 -40 200 320';

const RAINBOW_HAIR: HairPaint = { base: 'url(#rainbow-v)', dark: '#8a52d6', light: 'rgba(255,255,255,0.7)' };

export function hairPaint(id: string): HairPaint {
  const c = HAIR_COLORS[id] ?? HAIR_COLORS['hair-brown'];
  return c === 'rainbow' ? RAINBOW_HAIR : c;
}

/**
 * Nomi's character, drawn in layers from back to front. Everything she wears comes from WEARABLES.
 * mood 'joy' closes her eyes in a big smile, for when she buys something. viewBox can zoom in, e.g. on her head.
 */
export function Avatar({ look, mood = 'happy', className, viewBox = AVATAR_VIEWBOX }: { look: Look; mood?: Mood; className?: string; viewBox?: string }) {
  const skin = paint(look.skin);
  skin.dark = shade(look.skin, -0.2);
  const hair = hairPaint(look.hairColor);

  const layer = (slot: WornSlot, part: 'back' | 'main' | 'over') => {
    const id = look.worn[slot];
    const draw = id && WEARABLES[id]?.[part];
    return draw ? <g className={`layer-${slot}`}>{draw(paint(colorOf(look, id)), skin)}</g> : null;
  };

  return (
    <svg className={`avatar${className ? ` ${className}` : ''}`} viewBox={viewBox} aria-hidden="true">
      <ellipse cx={100} cy={266} rx={46} ry={7} fill="rgba(80, 40, 120, 0.12)" />
      {layer('back', 'back')}
      {HAIR[look.hair].back?.(hair)}

      <Mirror>
        <Limb from={[90, 208]} to={[90, 250]} width={16} fill={skin.base} outline={skin.dark} />
      </Mirror>
      {layer('bottom', 'main')}
      {layer('shoes', 'main')}

      <Mirror>
        <Limb from={ARM.from} to={ARM.to} width={ARM_WIDTH} fill={skin.base} outline={skin.dark} />
      </Mirror>
      <path d="M 92 128 L 108 128 L 108 154 L 92 154 Z" fill={skin.base} stroke={skin.dark} strokeWidth={2} />
      <path d="M 76 162 Q 76 151 88 151 L 112 151 Q 124 151 124 162 L 125 210 L 75 210 Z" fill={skin.base} stroke={skin.dark} strokeWidth={2} />
      {layer('top', 'main')}
      {layer('dress', 'main')}
      {layer('neck', 'main')}
      <Mirror>
        <circle cx={HAND[0]} cy={HAND[1]} r={8.5} fill={skin.base} stroke={skin.dark} strokeWidth={2.5} />
      </Mirror>
      {layer('back', 'over')}

      <Head skin={skin} look={look} mood={mood} />
      {HAIR[look.hair].front(hair)}
      {layer('face', 'main')}
      {layer('hat', 'main')}
      {layer('hand', 'main')}
    </svg>
  );
}

function Head({ skin, look, mood }: { skin: { base: string; dark: string }; look: Look; mood: Mood }) {
  const ink = '#2f2440';
  return (
    <g className="head">
      <Mirror>
        <circle cx={49} cy={100} r={9} fill={skin.base} stroke={skin.dark} strokeWidth={2.5} />
        <path d="M 47 96 Q 52 100 48 105" fill="none" stroke={skin.dark} strokeWidth={1.8} strokeLinecap="round" />
      </Mirror>
      <ellipse cx={100} cy={92} rx={52} ry={50} fill={skin.base} stroke={skin.dark} strokeWidth={2.5} />

      <Mirror>
        <ellipse cx={71} cy={113} rx={8.5} ry={5} fill="#ff7a9c" opacity={0.35} />
        <path d="M 74 85 Q 80 81 87 84" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.75} />
        {mood === 'joy' ? (
          <path d="M 73 101 Q 80 92 87 101" fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
        ) : (
          <g className="eye">
            <ellipse cx={80} cy={99} rx={7.5} ry={9.5} fill={look.eyes} stroke={ink} strokeWidth={2} />
            <ellipse cx={80} cy={100} rx={4.4} ry={6} fill={ink} />
            <circle cx={82.6} cy={95.2} r={2.7} fill="#fff" />
            <circle cx={77.6} cy={103.6} r={1.3} fill="#fff" />
            <path d="M 72.8 93.5 L 69.5 91 M 73.6 97.5 L 69.8 96.6" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
          </g>
        )}
      </Mirror>

      {look.freckles && (
        <g fill={shade(look.skin, -0.32)} opacity={0.75}>
          {[
            [66, 108],
            [72, 110.5],
            [69, 104.5],
            [134, 108],
            [128, 110.5],
            [131, 104.5],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} />
          ))}
        </g>
      )}

      <path d="M 97.5 108.5 Q 100 110.5 102.5 108.5" fill="none" stroke={skin.dark} strokeWidth={2} strokeLinecap="round" />
      {mood === 'joy' ? (
        <path d="M 89 115 Q 100 132 111 115 Q 100 119 89 115 Z" fill="#c2416b" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
      ) : (
        <>
          <path d="M 91.5 116 Q 100 127 108.5 116 Q 100 119 91.5 116 Z" fill="#c2416b" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
          <path d="M 96 121.5 Q 100 119.5 104 121.5 Q 100 124 96 121.5 Z" fill="#ff8fa8" />
        </>
      )}
    </g>
  );
}
