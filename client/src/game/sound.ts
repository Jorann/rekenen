import { load, save } from './storage.ts';

/** Small synthesized sounds, so there are no audio files to load. */
let ctx: AudioContext | null = null;
let muted = load('rekenen.muted', false);

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  save('rekenen.muted', value);
}

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    // iPadOS only allows audio after a tap; every sound here is triggered by one.
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, at: number, duration: number, type: OscillatorType = 'sine', volume = 0.18): void {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568;

export const sound = {
  tap: () => tone(880, 0, 0.06, 'sine', 0.05),
  correct: () => {
    tone(E6, 0, 0.18, 'triangle');
    tone(G6, 0.09, 0.3, 'triangle');
  },
  wrong: () => {
    tone(330, 0, 0.16, 'sine', 0.14);
    tone(262, 0.13, 0.25, 'sine', 0.14);
  },
  round: () => {
    [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle'));
    tone(E6, 0.45, 0.6, 'triangle', 0.12);
  },
  /** A coin lands in her purse. */
  coin: () => {
    tone(1975.5, 0, 0.09, 'square', 0.035);
    tone(2637, 0.07, 0.28, 'square', 0.03);
  },
  /** Something bought: a cash register "ka-ching" and a sparkle. */
  buy: () => {
    tone(1318.5, 0, 0.08, 'square', 0.05);
    tone(1975.5, 0.08, 0.16, 'square', 0.045);
    [C6, E6, G6, 2093].forEach((f, i) => tone(f, 0.22 + i * 0.07, 0.3, 'triangle', 0.1));
  },
  /** Putting something on. */
  wear: () => {
    tone(660, 0, 0.08, 'sine', 0.1);
    tone(990, 0.05, 0.12, 'sine', 0.08);
  },
  /** Not enough coins yet: gentle, not a "wrong" sound. */
  nope: () => {
    tone(440, 0, 0.12, 'triangle', 0.08);
    tone(392, 0.1, 0.18, 'triangle', 0.08);
  },
  final: () => {
    const melody = [C5, E5, G5, C6, G5, C6, E6, G6];
    melody.forEach((f, i) => tone(f, i * 0.13, 0.4, 'triangle'));
    [C5, E5, G5, C6].forEach((f) => tone(f, melody.length * 0.13, 1.4, 'sine', 0.1));
  },
};
