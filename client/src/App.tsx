import { useState } from 'react';
import { SharedDefs } from './avatar/SharedDefs.tsx';
import { FinalReward, type GameStats } from './components/FinalReward.tsx';
import { Game } from './components/Game.tsx';
import { Home, shopFor, WhoAreYou, type Destination } from './components/Home.tsx';
import { Place } from './components/Place.tsx';
import { DEFAULT_SETTINGS, Setup } from './components/Setup.tsx';
import { Sky } from './components/Sky.tsx';
import { Wardrobe } from './components/Wardrobe.tsx';
import { ASK_NAME, PLAYER_NAME } from './config.ts';
import { post } from './game/outbox.ts';
import { usePlayer } from './game/player.ts';
import type { GameSettings } from './game/questions.ts';
import { load, save } from './game/storage.ts';
import { uuid } from './game/uuid.ts';

type Screen =
  | { kind: 'home' }
  | { kind: 'setup' }
  | { kind: 'play'; sessionId: string }
  | { kind: 'done'; stats: GameStats }
  | { kind: 'wardrobe'; focus?: string }
  | { kind: 'place'; focus?: string };

export function App() {
  const [name, setName] = useState(() => (ASK_NAME ? load('rekenen.name', '') : PLAYER_NAME));

  function choose(playerName: string) {
    setName(playerName);
    save('rekenen.name', playerName);
  }

  return (
    <>
      <SharedDefs />
      <Sky />
      {name ? <Main key={name} name={name} onSwitchPlayer={() => choose('')} /> : <WhoAreYou initial="" onName={choose} />}
    </>
  );
}

function Main({ name, onSwitchPlayer }: { name: string; onSwitchPlayer: () => void }) {
  const player = usePlayer(name);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...DEFAULT_SETTINGS, ...load('rekenen.settings', {}) }));
  const home = () => setScreen({ kind: 'home' });

  function start(s: GameSettings) {
    setSettings(s);
    save('rekenen.settings', s);

    const sessionId = uuid();
    post('/api/sessions', {
      id: sessionId,
      playerName: name,
      operations: s.operations,
      questionsPerRound: s.questionsPerRound,
      roundsTotal: s.rounds,
      settings: { maxNumber: s.maxNumber, tables: s.tables },
      startedAt: new Date().toISOString(),
    });
    setScreen({ kind: 'play', sessionId });
  }

  /** focus: an item to show straight away, e.g. her wish. */
  function go(to: Destination, focus?: string) {
    setScreen(to === 'play' ? { kind: 'setup' } : { kind: to, focus });
  }

  switch (screen.kind) {
    case 'home':
      return <Home player={player} onGo={go} onSwitchPlayer={onSwitchPlayer} />;
    case 'setup':
      return <Setup initialSettings={settings} onStart={start} onBack={home} />;
    case 'play':
      return (
        <Game
          key={screen.sessionId}
          player={player}
          settings={settings}
          sessionId={screen.sessionId}
          onDone={(stats) => setScreen({ kind: 'done', stats })}
          onQuit={home}
        />
      );
    case 'done':
      return (
        <FinalReward player={player} stats={screen.stats} onAgain={() => start(settings)} onHome={home} onWish={(id) => go(shopFor(id), id)} />
      );
    case 'wardrobe':
      return <Wardrobe player={player} focus={screen.focus} onBack={home} />;
    case 'place':
      return <Place player={player} focus={screen.focus} onBack={home} />;
  }
}
