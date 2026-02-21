import { Transport } from './Transport';
import { Metronome } from './Metronome';
import { Track } from './Track';
import { GlobalConfig, DEFAULT_GLOBAL_CONFIG } from './GlobalConfig';
import { FxChain } from './FxChain';
import { FxConfig } from './FxConfig';

export type EngineListener = () => void;

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  audioContext: AudioContext | null = null;
  masterGain: GainNode | null = null;
  micStream: MediaStream | null = null;
  micSource: MediaStreamAudioSourceNode | null = null;

  // Monitor + input FX
  monitorGain: GainNode | null = null;
  inputFxChain: FxChain | null = null;

  transport: Transport;
  metronome: Metronome;
  tracks: Track[] = [];
  config: GlobalConfig;
  masterLoopLengthBeats: number | null = null;

  private listeners: Set<EngineListener> = new Set();

  private constructor() {
    this.config = { ...DEFAULT_GLOBAL_CONFIG };
    this.transport = new Transport(this);
    this.metronome = new Metronome(this);
    for (let i = 0; i < 4; i++) {
      this.tracks.push(new Track(this, i));
    }
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  static resetInstance(): void {
    if (AudioEngine.instance) {
      AudioEngine.instance.dispose();
      AudioEngine.instance = null;
    }
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach(l => l());
  }

  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // Create input FX chain and monitor gain
    this.inputFxChain = new FxChain(this.audioContext);
    this.monitorGain = this.audioContext.createGain();
    this.monitorGain.gain.value = this.config.monitorOn ? this.config.monitorVolume / 100 : 0;
    this.inputFxChain.output.connect(this.monitorGain);
    this.monitorGain.connect(this.audioContext.destination);

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async requestMic(): Promise<void> {
    if (this.micStream) return;
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (this.audioContext) {
      this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
      // Connect mic to input FX chain for monitoring
      if (this.inputFxChain) {
        this.micSource.connect(this.inputFxChain.input);
      }
    }
  }

  get currentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  get sampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  updateConfig(partial: Partial<GlobalConfig>): void {
    const oldBpm = this.config.bpm;
    this.config = { ...this.config, ...partial };

    if (partial.bpm !== undefined && partial.bpm !== oldBpm) {
      this.transport.onBpmChange(oldBpm, this.config.bpm);
      this.tracks.forEach(t => t.onBpmChange(oldBpm, this.config.bpm));
    }

    if (partial.metronomeVolume !== undefined || partial.metronomeOn !== undefined) {
      this.metronome.updateFromConfig();
    }

    if (partial.monitorVolume !== undefined || partial.monitorOn !== undefined) {
      if (this.monitorGain) {
        this.monitorGain.gain.value = this.config.monitorOn ? this.config.monitorVolume / 100 : 0;
      }
    }

    this.notify();
  }

  updateInputFx(partial: Partial<FxConfig>): void {
    this.inputFxChain?.updateConfig(partial);
    this.notify();
  }

  getInputFxConfig(): FxConfig | null {
    return this.inputFxChain?.getConfig() ?? null;
  }

  setMasterLoopLength(beats: number): void {
    this.masterLoopLengthBeats = beats;
    this.notify();
  }

  stopAllTracks(): void {
    this.tracks.forEach(t => {
      if (t.state === 'playing' || t.state === 'overdubbing') {
        t.stop();
      }
    });
  }

  dispose(): void {
    this.transport.stop();
    this.tracks.forEach(t => t.dispose());
    this.inputFxChain?.dispose();
    this.micStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.micStream = null;
    this.micSource = null;
    this.masterGain = null;
    this.monitorGain = null;
    this.inputFxChain = null;
  }
}
