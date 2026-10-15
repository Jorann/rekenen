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
  final: () => {
    const melody = [C5, E5, G5, C6, G5, C6, E6, G6];
    melody.forEach((f, i) => tone(f, i * 0.13, 0.4, 'triangle'));
    [C5, E5, G5, C6].forEach((f) => tone(f, melody.length * 0.13, 1.4, 'sine', 0.1));
  },
};
