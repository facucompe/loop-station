import { AudioEngine } from './AudioEngine';
import { getBeatsPerMeasure, getSecondsPerBeat } from './GlobalConfig';

export type TransportListener = (beat: number, measure: number, time: number) => void;

export class Transport {
  private engine: AudioEngine;
  private timerId: number | null = null;
  private scheduleAheadTime = 0.1; // seconds
  private lookAhead = 25; // ms
  private nextNoteTime = 0;

  beat = 0;       // current beat within measure (0-indexed)
  measure = 0;    // current measure (0-indexed)
  isRunning = false;

  private listeners: Set<TransportListener> = new Set();

  constructor(engine: AudioEngine) {
    this.engine = engine;
  }

  onTick(listener: TransportListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitTick(time: number): void {
    this.listeners.forEach(l => l(this.beat, this.measure, time));
  }

  start(): void {
    if (this.isRunning) return;
    if (!this.engine.audioContext) return;

    this.isRunning = true;
    this.beat = 0;
    this.measure = 0;
    this.nextNoteTime = this.engine.audioContext.currentTime;
    this.scheduler();
    this.engine.notify();
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.beat = 0;
    this.measure = 0;
    this.engine.notify();
  }

  private scheduler = (): void => {
    if (!this.isRunning || !this.engine.audioContext) return;

    while (this.nextNoteTime < this.engine.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.nextNoteTime);
      this.advanceBeat();
    }

    this.timerId = window.setTimeout(this.scheduler, this.lookAhead);
  };

  private scheduleBeat(time: number): void {
    this.emitTick(time);
    this.engine.metronome.playClick(time, this.beat === 0);
  }

  private advanceBeat(): void {
    const beatsPerMeasure = getBeatsPerMeasure(this.engine.config.timeSignature);
    const secondsPerBeat = getSecondsPerBeat(this.engine.config.bpm);

    this.nextNoteTime += secondsPerBeat;
    this.beat++;

    if (this.beat >= beatsPerMeasure) {
      this.beat = 0;
      this.measure++;
    }
  }

  onBpmChange(_oldBpm: number, _newBpm: number): void {
    // nextNoteTime adjustments happen naturally since we recalculate secondsPerBeat each tick
  }

  getNextMeasureBoundaryTime(): number {
    if (!this.engine.audioContext) return 0;
    const beatsPerMeasure = getBeatsPerMeasure(this.engine.config.timeSignature);
    const secondsPerBeat = getSecondsPerBeat(this.engine.config.bpm);
    const beatsUntilMeasure = beatsPerMeasure - this.beat;
    return this.nextNoteTime + (beatsUntilMeasure - 1) * secondsPerBeat;
  }

  getNextBeatBoundaryTime(): number {
    return this.nextNoteTime;
  }

  getMeasureDuration(): number {
    const beatsPerMeasure = getBeatsPerMeasure(this.engine.config.timeSignature);
    const secondsPerBeat = getSecondsPerBeat(this.engine.config.bpm);
    return beatsPerMeasure * secondsPerBeat;
  }
}
