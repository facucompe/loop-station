export type TimeSignature = '2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8';
export type PlayMode = 'multi' | 'single';
export type LoopLength = 'auto' | number; // number = 1–64 measures

export interface GlobalConfig {
  bpm: number;             // 40–300
  timeSignature: TimeSignature;
  playMode: PlayMode;
  metronomeVolume: number; // 0–100
  metronomeOn: boolean;
  loopLength: LoopLength;
  monitorVolume: number;   // 0–100
  monitorOn: boolean;
}

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  bpm: 120,
  timeSignature: '4/4',
  playMode: 'multi',
  metronomeVolume: 70,
  metronomeOn: true,
  loopLength: 'auto',
  monitorVolume: 50,
  monitorOn: false,
};

export function getBeatsPerMeasure(ts: TimeSignature): number {
  const [beats] = ts.split('/').map(Number);
  return beats;
}

export function getBeatUnit(ts: TimeSignature): number {
  const [, unit] = ts.split('/').map(Number);
  return unit;
}

export function getSecondsPerBeat(bpm: number): number {
  return 60 / bpm;
}

export function getMeasureDuration(bpm: number, ts: TimeSignature): number {
  return getSecondsPerBeat(bpm) * getBeatsPerMeasure(ts);
}
