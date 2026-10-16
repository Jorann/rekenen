import { CATALOG } from '../../../shared/catalog.ts';
import { Avatar } from '../avatar/Avatar.tsx';
import { WEARABLES } from '../avatar/clothes.tsx';
import { Pet } from '../avatar/pets.tsx';
import { GARDEN, HOUSES, thingPaint, type Thing } from '../home/drawings.tsx';
import { DEFAULT_LOOK, HAIR_STYLES, SKIN_TONES, wear, type Look } from '../avatar/look.ts';
import { SharedDefs } from '../avatar/SharedDefs.tsx';

const cell = { background: '#fff', borderRadius: 16, padding: 8, textAlign: 'center' as const, fontSize: 13 };

/** Development only (open /#gallery): every drawing at once, to check them side by side. */
export function Gallery() {
  const hairColors = ['hair-brown', 'hair-blond', 'hair-black', 'hair-red', 'hair-pink', 'hair-purple', 'hair-mint', 'hair-rainbow'];
  const looks: Look[] = HAIR_STYLES.map((hair, i) => ({
    ...DEFAULT_LOOK,
    hair,
    hairColor: hairColors[i % hairColors.length],
    skin: SKIN_TONES[i % SKIN_TONES.length],
    freckles: i % 3 === 0,
  }));
  const only = new URLSearchParams(location.search).get('slot');
  const items = CATALOG.filter((i) => WEARABLES[i.id] && (!only || i.slot === only));
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 16, background: '#f7f0ff' }}>
      <SharedDefs />
      {!only && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 16 }}>
          {looks.map((look, i) => (
            <div key={i} style={cell}>
              <Avatar look={look} mood={i === 7 ? 'joy' : 'happy'} />
              {look.hair}
            </div>
          ))}
        </div>
      )}
      {(!only || only === 'pet') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 16 }}>
          {CATALOG.filter((i) => i.slot === 'pet').map((pet) => (
            <div key={pet.id} style={cell}>
              <Pet id={pet.id} />
              {pet.id}
            </div>
          ))}
        </div>
      )}
      {(!only || only === 'home') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
          {Object.entries({ ...HOUSES, ...GARDEN }).map(([id, thing]: [string, Thing]) => (
            <div key={id} style={cell}>
              <svg viewBox={`0 0 ${thing.w} ${thing.h}`} style={{ width: '100%', height: 140 }}>
                {thing.draw(thingPaint(undefined))}
              </svg>
              {id}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
        {items.map((item, i) => (
          <div key={item.id} style={cell}>
            <Avatar look={wear({ ...looks[i % looks.length], hair: item.slot === 'hat' ? 'long' : looks[i % looks.length].hair }, item.id)} />
            {item.id}
          </div>
        ))}
      </div>
    </div>
  );
}
