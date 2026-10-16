import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { activeNow } from '../game/clock.ts';
import { post } from '../game/outbox.ts';
import type { Player } from '../game/player.ts';
import { makeRound, SYMBOL, type GameSettings } from '../game/questions.ts';
import { sound } from '../game/sound.ts';
import { CoinBadge, CoinIcon } from './Coin.tsx';
import { sparkle } from './effects.ts';
import type { GameStats } from './FinalReward.tsx';
import { MuteButton } from './MuteButton.tsx';
import { NumPad } from './NumPad.tsx';
import { RoundReward } from './RoundReward.tsx';

const PRAISE = ['Goed zo! 🌟', 'Super! 🦄', 'Knap hoor! 🌈', 'Top! ⭐', 'Geweldig! 💖', 'Wauw! ✨', 'Helemaal goed! 🎉'];
const TRY_AGAIN = ['Bijna! Probeer het nog eens 💪', 'Oeps! Nog een keer proberen 🌈', 'Kijk nog eens goed 🦄'];
const MAX_DIGITS = 3;

interface Attempt {
  answer: number;
  isCorrect: boolean;
  elapsedMs: number;
  attemptedAt: string;
}

type Feedback = 'none' | 'wrong' | 'correct';

interface FlyingCoin {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

let coinIds = 0;

export function Game({
  player,
  settings,
  sessionId,
  onDone,
  onQuit,
}: {
  player: Player;
  settings: GameSettings;
  sessionId: string;
  onDone: (stats: GameStats) => void;
  onQuit: () => void;
}) {
  const [roundNumber, setRoundNumber] = useState(1);
  const [questions, setQuestions] = useState(() => makeRound(settings));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('none');
  const [praise, setPraise] = useState(PRAISE[0]);
  const [wrongCount, setWrongCount] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [flying, setFlying] = useState<FlyingCoin[]>([]);
  const [coinBump, setCoinBump] = useState(0);

  const timing = useRef({ shownActive: 0, shownAt: '', attempts: [] as Attempt[] });
  const pausedAt = useRef(0);
  const stats = useRef<GameStats>({ solved: 0, firstTry: 0, rounds: settings.rounds });
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const answerBox = useRef<HTMLDivElement>(null);
  const purse = useRef<HTMLDivElement>(null);

  const q = questions[index];

  // The clock for a sum starts the moment it is on screen.
  useEffect(() => {
    if (showReward) return;
    timing.current = { shownActive: activeNow(), shownAt: new Date().toISOString(), attempts: [] };
  }, [q.id, showReward]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  function advance() {
    setInput('');
    setFeedback('none');
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else if (roundNumber < settings.rounds) {
      setShowReward(true);
    } else {
      post(`/api/sessions/${sessionId}/finish`, { finishedAt: new Date().toISOString() });
      onDone(stats.current);
    }
  }

  function nextRound() {
    setQuestions(makeRound(settings));
    setIndex(0);
    setRoundNumber(roundNumber + 1);
    setShowReward(false);
  }

  function submit() {
    if (feedback !== 'none' || input === '') return;
    const answer = Number(input);
    const isCorrect = answer === q.answer;
    const t = timing.current;
    t.attempts.push({
      answer,
      isCorrect,
      elapsedMs: Math.round(activeNow() - t.shownActive),
      attemptedAt: new Date().toISOString(),
    });

    if (!isCorrect) {
      sound.wrong();
      setFeedback('wrong');
      setWrongCount((c) => c + 1);
      return;
    }

    sound.correct();
    sparkle(answerBox.current);
    launchCoin();
    setFeedback('correct');
    setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    stats.current.solved += 1;
    if (t.attempts.length === 1) stats.current.firstTry += 1;

    const last = t.attempts[t.attempts.length - 1];
    post(
      `/api/sessions/${sessionId}/questions`,
      {
        id: q.id,
        roundNumber,
        position: index + 1,
        operation: q.op,
        operandA: q.a,
        operandB: q.b,
        correctAnswer: q.answer,
        shownAt: t.shownAt,
        solvedAt: last.attemptedAt,
        durationMs: last.elapsedMs,
        attempts: t.attempts,
      },
      { kind: 'coin', player: player.name },
    );

    advanceTimer.current = setTimeout(advance, 1100);
  }

  /** One coin per solved sum. It flies from the answer to her purse and counts when it lands. */
  function launchCoin() {
    const from = answerBox.current?.getBoundingClientRect();
    const to = purse.current?.querySelector('.coin-icon')?.getBoundingClientRect();
    if (!from || !to) return;
    const x = from.left + from.width / 2;
    const y = from.top + from.height / 2;
    setFlying((f) => [...f, { id: ++coinIds, x, y, dx: to.left + to.width / 2 - x, dy: to.top + to.height / 2 - y }]);
  }

  function coinLanded(id: number) {
    setFlying((f) => f.filter((c) => c.id !== id));
    setCoinBump((n) => n + 1);
    sound.coin();
  }

  function pressDigit(digit: string) {
    if (feedback === 'correct') return;
    sound.tap();
    if (feedback === 'wrong') {
      // Typing again replaces the wrong answer.
      setFeedback('none');
      setInput(digit);
      return;
    }
    setInput((prev) => (prev === '0' ? digit : prev.length >= MAX_DIGITS ? prev : prev + digit));
  }

  function pressBack() {
    if (feedback === 'correct') return;
    sound.tap();
    if (feedback === 'wrong') {
      setFeedback('none');
      setInput('');
      return;
    }
    setInput((prev) => prev.slice(0, -1));
  }

  function openQuit() {
    pausedAt.current = activeNow();
    setConfirmQuit(true);
  }

  function cancelQuit() {
    // Time spent looking at the "stop?" question doesn't count towards the sum.
    timing.current.shownActive += activeNow() - pausedAt.current;
    setConfirmQuit(false);
  }

  // A hardware keyboard works too, handy when testing on a laptop.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e) => {
    if (showReward || confirmQuit) return;
    if (/^[0-9]$/.test(e.key)) pressDigit(e.key);
    else if (e.key === 'Backspace') pressBack();
    else if (e.key === 'Enter') submit();
  };
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const solvedInRound = index + (feedback === 'correct' ? 1 : 0);

  return (
    <div className="game">
      <header className="topbar">
        <button className="icon-btn" onClick={openQuit} aria-label="Stoppen">
          🏠
        </button>
        <div className="round-label">
          Ronde {roundNumber} <span className="of">van {settings.rounds}</span>
        </div>
        <div className="topbar-right">
          <CoinBadge value={player.profile.balance - flying.length} bump={coinBump} ref={purse} />
          <MuteButton />
        </div>
      </header>

      <div className="progress-stars" aria-label={`${solvedInRound} van de ${questions.length} sommen`}>
        {questions.map((item, i) => (
          <span key={item.id} className={`pstar${i < solvedInRound ? ' done' : ''}${i === index ? ' current' : ''}`}>
            ★
          </span>
        ))}
      </div>

      <main className="play-area">
        <div className="sum-card">
          <div className="sum" key={q.id}>
            <span className="num">{q.a}</span>
            <span className="op">{SYMBOL[q.op]}</span>
            <span className="num">{q.b}</span>
            <span className="op">=</span>
            <div ref={answerBox} key={wrongCount} className={`answer ${feedback}`}>
              {input || <span className="placeholder">?</span>}
            </div>
          </div>
          <p className={`message ${feedback}`} aria-live="polite">
            {feedback === 'wrong' ? TRY_AGAIN[(wrongCount - 1) % TRY_AGAIN.length] : feedback === 'correct' ? praise : ' '}
          </p>
        </div>

        <NumPad
          onDigit={pressDigit}
          onBack={pressBack}
          onOk={submit}
          locked={feedback === 'correct'}
          canSubmit={input !== '' && feedback === 'none'}
        />
      </main>

      {flying.map((c) => (
        <span
          key={c.id}
          className="flying-coin"
          style={{ left: c.x, top: c.y, '--dx': `${c.dx}px`, '--dy': `${c.dy}px` } as CSSProperties}
          onAnimationEnd={() => coinLanded(c.id)}
        >
          <CoinIcon />
        </span>
      ))}

      {showReward && <RoundReward round={roundNumber} total={settings.rounds} coins={questions.length} onNext={nextRound} />}

      {confirmQuit && (
        <div className="overlay confirm">
          <div className="confirm-card">
            <p className="confirm-title">Wil je stoppen?</p>
            <div className="confirm-buttons">
              <button className="big-btn" onClick={cancelQuit}>
                Nee, verder rekenen
              </button>
              <button className="big-btn secondary" onClick={onQuit}>
                Ja, stoppen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
