import { FxConfig, DEFAULT_FX_CONFIG } from './FxConfig';

export type RecAction = 'rec→dub→play' | 'rec→play→dub';
export type DubMode = 'overdub' | 'replace';
export type StartMode = 'immediate' | 'fade-in';
export type StopMode = 'immediate' | 'fade-out' | 'loop-end';
export type LoopQuantize = 'off' | 'beat' | 'measure';
export type TrackSpeed = 0.5 | 1 | 2;

export type TrackState = 'empty' | 'recording' | 'playing' | 'overdubbing' | 'stopped';

export interface TrackConfig {
  recAction: RecAction;
  dubMode: DubMode;
  oneShot: boolean;
  startMode: StartMode;
  stopMode: StopMode;
  fadeTime: number;      // 1–8 measures
  playLevel: number;     // 0–100
  pan: number;           // -100 to +100
  reverse: boolean;
  speed: TrackSpeed;
  tempoSync: boolean;
  loopSync: boolean;
  loopQuantize: LoopQuantize;
  fx: FxConfig;
}

export const DEFAULT_TRACK_CONFIG: TrackConfig = {
  recAction: 'rec→dub→play',
  dubMode: 'overdub',
  oneShot: false,
  startMode: 'immediate',
  stopMode: 'immediate',
  fadeTime: 1,
  playLevel: 100,
  pan: 0,
  reverse: false,
  speed: 1,
  tempoSync: true,
  loopSync: true,
  loopQuantize: 'beat',
  fx: JSON.parse(JSON.stringify(DEFAULT_FX_CONFIG)),
};
