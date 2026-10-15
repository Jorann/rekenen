import { useState } from 'react';
import { FinalReward, type GameStats } from './components/FinalReward.tsx';
import { Game } from './components/Game.tsx';
import { DEFAULT_SETTINGS, Setup } from './components/Setup.tsx';
import { Sky } from './components/Sky.tsx';
import { ASK_NAME, PLAYER_NAME } from './config.ts';
import { post } from './game/outbox.ts';
import type { GameSettings } from './game/questions.ts';
import { load, save } from './game/storage.ts';
import { uuid } from './game/uuid.ts';

type Screen =
  | { kind: 'setup' }
  | { kind: 'play'; sessionId: string }
  | { kind: 'done'; stats: GameStats };

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'setup' });
  const [name, setName] = useState(() => (ASK_NAME ? load('rekenen.name', '') : PLAYER_NAME));
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...DEFAULT_SETTINGS, ...load('rekenen.settings', {}) }));

  function start(playerName: string, s: GameSettings) {
    setName(playerName);
    setSettings(s);
    save('rekenen.name', playerName);
    save('rekenen.settings', s);

    const sessionId = uuid();
    post('/api/sessions', {
      id: sessionId,
      playerName,
      operations: s.operations,
      questionsPerRound: s.questionsPerRound,
      roundsTotal: s.rounds,
      settings: { maxNumber: s.maxNumber, tables: s.tables },
      startedAt: new Date().toISOString(),
    });
    setScreen({ kind: 'play', sessionId });
  }

  return (
    <>
      <Sky />
      {screen.kind === 'setup' && <Setup initialName={name} initialSettings={settings} onStart={start} />}
      {screen.kind === 'play' && (
        <Game
          key={screen.sessionId}
          settings={settings}
          sessionId={screen.sessionId}
          onDone={(stats) => setScreen({ kind: 'done', stats })}
          onQuit={() => setScreen({ kind: 'setup' })}
        />
      )}
      {screen.kind === 'done' && (
        <FinalReward
          name={name}
          stats={screen.stats}
          onAgain={() => start(name, settings)}
          onHome={() => setScreen({ kind: 'setup' })}
        />
      )}
    </>
  );
}
