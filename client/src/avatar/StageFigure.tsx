import { Avatar, type Mood } from './Avatar.tsx';
import type { Look } from './look.ts';
import { Pet } from './pets.tsx';

/** Her character as big as fits, with her pet sitting next to her (home screen and wardrobe). */
export function StageFigure({ look, mood }: { look: Look; mood?: Mood }) {
  const pet = look.worn.pet;
  return (
    <div className={`stage-figure${pet ? ' with-pet' : ''}`}>
      <div className="figure-duo">
        <Avatar look={look} mood={mood} className="idle" />
        {pet && <Pet id={pet} className="stage-pet idle" />}
      </div>
    </div>
  );
}
