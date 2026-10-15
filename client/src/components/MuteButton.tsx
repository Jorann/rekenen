import { useState } from 'react';
import { isMuted, setMuted } from '../game/sound.ts';

export function MuteButton() {
  const [muted, setMutedState] = useState(isMuted);
  return (
    <button
      className="icon-btn"
      onClick={() => {
        setMuted(!muted);
        setMutedState(!muted);
      }}
      aria-label={muted ? 'Geluid aan' : 'Geluid uit'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
