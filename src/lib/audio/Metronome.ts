import { AudioEngine } from './AudioEngine';

export class Metronome {
  private engine: AudioEngine;
  private gainNode: GainNode | null = null;

  constructor(engine: AudioEngine) {
    this.engine = engine;
  }

  private ensureGain(): GainNode | null {
    if (!this.engine.audioContext || !this.engine.masterGain) return null;
    if (!this.gainNode) {
      this.gainNode = this.engine.audioContext.createGain();
      this.gainNode.connect(this.engine.masterGain);
    }
    this.gainNode.gain.value = this.engine.config.metronomeOn
      ? this.engine.config.metronomeVolume / 100
      : 0;
    return this.gainNode;
  }

  playClick(time: number, isAccent: boolean): void {
    const ctx = this.engine.audioContext;
    const gain = this.ensureGain();
    if (!ctx || !gain) return;
    if (!this.engine.config.metronomeOn) return;

    const osc = ctx.createOscillator();
    const envGain = ctx.createGain();

    osc.connect(envGain);
    envGain.connect(gain);

    osc.frequency.value = isAccent ? 1000 : 800;
    osc.type = 'sine';

    const duration = 0.03;
    envGain.gain.setValueAtTime(isAccent ? 1 : 0.6, time);
    envGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration);
  }

  updateFromConfig(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this.engine.config.metronomeOn
        ? this.engine.config.metronomeVolume / 100
        : 0;
    }
  }
}
