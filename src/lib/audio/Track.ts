import { AudioEngine } from './AudioEngine';
import { TrackConfig, DEFAULT_TRACK_CONFIG, TrackState } from './TrackConfig';
import { getBeatsPerMeasure, getSecondsPerBeat } from './GlobalConfig';
import { FxChain } from './FxChain';
import { FxConfig } from './FxConfig';

export class Track {
  private engine: AudioEngine;
  readonly index: number;
  config: TrackConfig;
  state: TrackState = 'empty';

  // Audio nodes
  private gainNode: GainNode | null = null;
  private panNode: StereoPannerNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  // Per-track FX chain (playback)
  private fxChain: FxChain | null = null;

  // Buffer management
  buffer: AudioBuffer | null = null;
  private previousBuffer: AudioBuffer | null = null; // for undo
  recordedBpm: number = 120;
  loopLengthBeats: number = 0;

  // Recording
  private recordingProcessor: ScriptProcessorNode | null = null;
  private recordedChunks: Float32Array[] = [];
  private recordStartTime: number = 0;
  private scheduledRecordStart: number | null = null;

  // Overdub
  private overdubProcessor: ScriptProcessorNode | null = null;
  private overdubPosition: number = 0;

  // Playback
  private playbackStartTime: number = 0;
  private fadeGainNode: GainNode | null = null;

  // Waveform data for visualization
  waveformData: Float32Array | null = null;

  constructor(engine: AudioEngine, index: number) {
    this.engine = engine;
    this.index = index;
    this.config = { ...DEFAULT_TRACK_CONFIG, fx: JSON.parse(JSON.stringify(DEFAULT_TRACK_CONFIG.fx)) };
  }

  private ensureNodes(): void {
    const ctx = this.engine.audioContext;
    const master = this.engine.masterGain;
    if (!ctx || !master) return;

    if (!this.gainNode) {
      this.gainNode = ctx.createGain();
      this.panNode = ctx.createStereoPanner();
      this.fadeGainNode = ctx.createGain();
      this.fxChain = new FxChain(ctx);

      // source → fadeGain → fxChain.input ... fxChain.output → gainNode → pan → master
      this.fadeGainNode.connect(this.fxChain.input);
      this.fxChain.output.connect(this.gainNode);
      this.gainNode.connect(this.panNode);
      this.panNode.connect(master);

      // Apply saved FX config
      this.fxChain.updateConfig(this.config.fx);
    }

    this.gainNode.gain.value = this.config.playLevel / 100;
    this.panNode!.pan.value = this.config.pan / 100;
  }

  updateConfig(partial: Partial<TrackConfig>): void {
    this.config = { ...this.config, ...partial };

    if (this.gainNode && (partial.playLevel !== undefined)) {
      this.gainNode.gain.value = this.config.playLevel / 100;
    }
    if (this.panNode && (partial.pan !== undefined)) {
      this.panNode.pan.value = this.config.pan / 100;
    }
    if (partial.reverse !== undefined && this.buffer) {
      this.applyReverse();
      if (this.state === 'playing') {
        this.restartPlayback();
      }
    }
    if (partial.speed !== undefined && this.sourceNode) {
      this.sourceNode.playbackRate.value = this.getEffectivePlaybackRate();
    }

    this.engine.notify();
  }

  updateFxConfig(partial: Partial<FxConfig>): void {
    // Merge into stored config
    if (partial.reverb) this.config.fx.reverb = { ...this.config.fx.reverb, ...partial.reverb };
    if (partial.delay) this.config.fx.delay = { ...this.config.fx.delay, ...partial.delay };
    if (partial.distortion) this.config.fx.distortion = { ...this.config.fx.distortion, ...partial.distortion };
    if (partial.filter) this.config.fx.filter = { ...this.config.fx.filter, ...partial.filter };
    if (partial.compressor) this.config.fx.compressor = { ...this.config.fx.compressor, ...partial.compressor };
    if (partial.chorus) this.config.fx.chorus = { ...this.config.fx.chorus, ...partial.chorus };

    // Apply to live chain
    this.fxChain?.updateConfig(partial);
    this.engine.notify();
  }

  getFxConfig(): FxConfig {
    return JSON.parse(JSON.stringify(this.config.fx));
  }

  // Main action button — cycles through states based on recAction config
  toggleRecord(): void {
    switch (this.state) {
      case 'empty':
        this.startRecording();
        break;
      case 'recording':
        if (this.config.recAction === 'rec→dub→play') {
          this.stopRecordingAndPlay();
        } else {
          this.stopRecordingAndPlay();
        }
        break;
      case 'playing':
        if (this.config.recAction === 'rec→dub→play') {
          // Already went rec→play after first press, now dub
          this.startOverdub();
        } else {
          this.startOverdub();
        }
        break;
      case 'overdubbing':
        this.stopOverdub();
        break;
      case 'stopped':
        this.play();
        break;
    }
  }

  // Play/stop toggle
  togglePlayStop(): void {
    if (this.state === 'playing' || this.state === 'overdubbing') {
      this.stop();
    } else if (this.state === 'stopped' && this.buffer) {
      this.play();
    }
  }

  // --- Recording ---

  private startRecording(): void {
    const ctx = this.engine.audioContext;
    const micSource = this.engine.micSource;
    if (!ctx || !micSource) return;

    this.ensureNodes();

    // Handle quantization
    if (this.config.loopQuantize === 'measure' && this.engine.transport.isRunning) {
      this.state = 'recording';
      this.scheduledRecordStart = this.engine.transport.getNextMeasureBoundaryTime();
      this.beginCapture(this.scheduledRecordStart);
    } else if (this.config.loopQuantize === 'beat' && this.engine.transport.isRunning) {
      this.state = 'recording';
      this.scheduledRecordStart = this.engine.transport.getNextBeatBoundaryTime();
      this.beginCapture(this.scheduledRecordStart);
    } else {
      this.state = 'recording';
      this.beginCapture(ctx.currentTime);
    }

    // Start transport if not running
    if (!this.engine.transport.isRunning) {
      this.engine.transport.start();
    }

    this.engine.notify();
  }

  private beginCapture(startTime: number): void {
    const ctx = this.engine.audioContext;
    const inputFxChain = this.engine.inputFxChain;
    if (!ctx || !inputFxChain) return;

    this.recordedChunks = [];
    this.recordStartTime = startTime;

    // Use ScriptProcessorNode for capture (AudioWorklet would be better but more complex)
    const bufferSize = 4096;
    this.recordingProcessor = ctx.createScriptProcessor(bufferSize, 1, 1);

    const capturing = { started: false };

    this.recordingProcessor.onaudioprocess = (e) => {
      if (ctx.currentTime < startTime && !capturing.started) return;
      capturing.started = true;
      const input = e.inputBuffer.getChannelData(0);
      this.recordedChunks.push(new Float32Array(input));
      // Pass through silence
      e.outputBuffer.getChannelData(0).fill(0);
    };

    // Connect from input FX chain output (wet signal) instead of raw mic
    inputFxChain.output.connect(this.recordingProcessor);
    this.recordingProcessor.connect(ctx.destination); // needed for processing to work
  }

  /**
   * Build a list of musically meaningful loop lengths (in beats), then snap
   * the raw recorded duration to the closest candidate.
   *
   * Candidates (for 4/4):
   *   sub-measure: 1, 2, 3, 4 beats
   *   measure multiples: 4, 8, 16, 32, 64, 128, 256 beats (1–64 measures)
   *
   * For 3/4 the measure size is 3, so candidates are 1, 2, 3, 6, 12, 24 …
   *
   * When loopQuantize = 'measure' only measure-multiple candidates are used.
   * When loopQuantize = 'beat' all candidates are used.
   * When loopQuantize = 'off' the raw duration is kept (no snapping).
   */
  private stopRecordingAndPlay(): void {
    const ctx = this.engine.audioContext;
    if (!ctx) return;

    this.stopCapture();

    const totalSamples = this.recordedChunks.reduce((sum, c) => sum + c.length, 0);
    if (totalSamples === 0) {
      this.state = 'empty';
      this.engine.notify();
      return;
    }

    const bpm = this.engine.config.bpm;
    const ts = this.engine.config.timeSignature;
    const secPerBeat = getSecondsPerBeat(bpm);
    const beatsPerMeasure = getBeatsPerMeasure(ts);
    const recordedDuration = totalSamples / ctx.sampleRate;
    const recordedBeats = recordedDuration / secPerBeat;

    let targetBeats: number;

    if (this.config.loopQuantize === 'off') {
      // No snapping — use raw duration
      targetBeats = recordedBeats;
    } else {
      // Build candidate grid
      const candidates: number[] = [];

      if (this.config.loopQuantize === 'beat') {
        // Sub-measure beat candidates — only musically valid subdivisions.
        // For binary meters (2/4, 4/4) use powers of 2: 1, 2, 4
        // For others (3/4, 5/4, 6/8, 7/8) allow all beats: 1, 2, 3, …
        const binaryMeter = beatsPerMeasure > 0 && (beatsPerMeasure & (beatsPerMeasure - 1)) === 0;
        if (binaryMeter) {
          for (let b = 1; b <= beatsPerMeasure; b *= 2) {
            candidates.push(b);
          }
        } else {
          for (let b = 1; b <= beatsPerMeasure; b++) {
            candidates.push(b);
          }
        }
      } else {
        // 'measure' — minimum is 1 full measure
        candidates.push(beatsPerMeasure);
      }

      // Measure multiples: 2, 4, 8, 16, 32, 64 measures
      for (let m = 2; m <= 64; m *= 2) {
        candidates.push(m * beatsPerMeasure);
      }
      // Also include odd measure counts that are musically common: 3, 6
      candidates.push(3 * beatsPerMeasure);
      candidates.push(6 * beatsPerMeasure);

      // De-duplicate and sort
      const unique = [...new Set(candidates)].sort((a, b) => a - b);

      // Find closest candidate
      targetBeats = unique[0];
      let bestDist = Math.abs(recordedBeats - targetBeats);
      for (const c of unique) {
        const dist = Math.abs(recordedBeats - c);
        if (dist < bestDist) {
          bestDist = dist;
          targetBeats = c;
        }
      }
    }

    // If global loop length is explicitly set (in measures), override
    if (this.engine.config.loopLength !== 'auto') {
      targetBeats = (this.engine.config.loopLength as number) * beatsPerMeasure;
    }

    // First track sets master loop length; subsequent tracks snap to multiples
    if (this.engine.masterLoopLengthBeats === null) {
      this.engine.setMasterLoopLength(targetBeats);
    } else {
      const master = this.engine.masterLoopLengthBeats;
      targetBeats = Math.max(master, Math.round(targetBeats / master) * master);
    }

    targetBeats = Math.max(1, targetBeats);
    this.loopLengthBeats = targetBeats;
    this.recordedBpm = bpm;

    const targetLength = Math.round(targetBeats * secPerBeat * ctx.sampleRate);
    const finalBuffer = ctx.createBuffer(1, targetLength, ctx.sampleRate);
    const channelData = finalBuffer.getChannelData(0);

    let offset = 0;
    for (const chunk of this.recordedChunks) {
      for (let i = 0; i < chunk.length && offset < targetLength; i++, offset++) {
        channelData[offset] = chunk[i];
      }
    }

    this.buffer = finalBuffer;
    this.recordedChunks = [];
    this.updateWaveform();

    if (this.config.reverse) {
      this.applyReverse();
    }

    this.play();
  }

  private stopCapture(): void {
    if (this.recordingProcessor) {
      this.recordingProcessor.disconnect();
      // Disconnect from input FX chain output instead of raw mic
      this.engine.inputFxChain?.output.disconnect(this.recordingProcessor);
      this.recordingProcessor = null;
    }
  }

  // --- Playback ---

  play(): void {
    if (!this.buffer || !this.engine.audioContext) return;

    this.ensureNodes();

    // Single play mode: stop others
    if (this.engine.config.playMode === 'single') {
      this.engine.tracks.forEach(t => {
        if (t !== this && (t.state === 'playing' || t.state === 'overdubbing')) {
          t.stop();
        }
      });
    }

    this.stopSource();

    const ctx = this.engine.audioContext;
    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.loop = !this.config.oneShot;
    this.sourceNode.playbackRate.value = this.getEffectivePlaybackRate();
    this.sourceNode.connect(this.fadeGainNode!);

    // Handle start mode
    if (this.config.startMode === 'fade-in') {
      const fadeDuration = this.config.fadeTime * this.getMeasureDurationSeconds();
      this.fadeGainNode!.gain.setValueAtTime(0, ctx.currentTime);
      this.fadeGainNode!.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeDuration);
    } else {
      this.fadeGainNode!.gain.setValueAtTime(1, ctx.currentTime);
    }

    this.sourceNode.start();
    this.playbackStartTime = ctx.currentTime;
    this.state = 'playing';

    if (this.config.oneShot) {
      this.sourceNode.onended = () => {
        this.state = 'stopped';
        this.engine.notify();
      };
    }

    this.engine.notify();
  }

  stop(): void {
    const ctx = this.engine.audioContext;
    if (!ctx) return;

    if (this.state === 'overdubbing') {
      this.stopOverdub();
    }

    if (this.config.stopMode === 'fade-out' && this.fadeGainNode) {
      const fadeDuration = this.config.fadeTime * this.getMeasureDurationSeconds();
      this.fadeGainNode.gain.setValueAtTime(this.fadeGainNode.gain.value, ctx.currentTime);
      this.fadeGainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeDuration);
      setTimeout(() => {
        this.stopSource();
        this.state = 'stopped';
        this.engine.notify();
      }, fadeDuration * 1000);
    } else if (this.config.stopMode === 'loop-end' && this.buffer && this.sourceNode) {
      // Wait until end of current loop
      this.sourceNode.loop = false;
      this.sourceNode.onended = () => {
        this.state = 'stopped';
        this.sourceNode = null;
        this.engine.notify();
      };
    } else {
      this.stopSource();
      this.state = 'stopped';
      this.engine.notify();
    }
  }

  private stopSource(): void {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch { /* already stopped */ }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  // --- Overdub ---

  startOverdub(): void {
    const ctx = this.engine.audioContext;
    const inputFxChain = this.engine.inputFxChain;
    if (!ctx || !inputFxChain || !this.buffer) return;

    this.previousBuffer = this.cloneBuffer(this.buffer);
    this.state = 'overdubbing';
    this.overdubPosition = this.getCurrentPlaybackSample();

    const bufferSize = 4096;
    this.overdubProcessor = ctx.createScriptProcessor(bufferSize, 1, 1);

    this.overdubProcessor.onaudioprocess = (e) => {
      if (!this.buffer) return;
      const input = e.inputBuffer.getChannelData(0);
      const channelData = this.buffer.getChannelData(0);
      const len = channelData.length;

      for (let i = 0; i < input.length; i++) {
        const pos = (this.overdubPosition + i) % len;
        if (this.config.dubMode === 'overdub') {
          channelData[pos] += input[i];
          // Soft clip
          channelData[pos] = Math.max(-1, Math.min(1, channelData[pos]));
        } else {
          // Replace mode
          channelData[pos] = input[i];
        }
      }

      this.overdubPosition = (this.overdubPosition + input.length) % len;
      e.outputBuffer.getChannelData(0).fill(0);
    };

    // Connect from input FX chain output (wet signal)
    inputFxChain.output.connect(this.overdubProcessor);
    this.overdubProcessor.connect(ctx.destination);

    this.engine.notify();
  }

  stopOverdub(): void {
    if (this.overdubProcessor) {
      this.overdubProcessor.disconnect();
      this.engine.inputFxChain?.output.disconnect(this.overdubProcessor);
      this.overdubProcessor = null;
    }

    this.updateWaveform();
    this.state = 'playing';
    this.engine.notify();
  }

  // --- Undo ---

  undo(): void {
    if (this.previousBuffer) {
      this.buffer = this.previousBuffer;
      this.previousBuffer = null;
      this.updateWaveform();
      if (this.state === 'playing') {
        this.restartPlayback();
      }
      this.engine.notify();
    }
  }

  get canUndo(): boolean {
    return this.previousBuffer !== null;
  }

  // --- Clear ---

  clear(): void {
    this.stopSource();
    this.stopCapture();
    if (this.overdubProcessor) {
      this.overdubProcessor.disconnect();
      this.overdubProcessor = null;
    }
    this.buffer = null;
    this.previousBuffer = null;
    this.waveformData = null;
    this.state = 'empty';
    this.loopLengthBeats = 0;

    // Check if this was the master loop setter
    const hasOtherBuffers = this.engine.tracks.some((t, i) => i !== this.index && t.buffer);
    if (!hasOtherBuffers) {
      this.engine.masterLoopLengthBeats = null;
    }

    this.engine.notify();
  }

  // --- Tempo sync ---

  onBpmChange(oldBpm: number, newBpm: number): void {
    if (!this.config.tempoSync || !this.buffer) return;
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = this.getEffectivePlaybackRate();
    }
  }

  private getEffectivePlaybackRate(): number {
    let rate = this.config.speed;
    if (this.config.tempoSync && this.recordedBpm > 0) {
      rate *= this.engine.config.bpm / this.recordedBpm;
    }
    return rate;
  }

  // --- Reverse ---

  private applyReverse(): void {
    if (!this.buffer) return;
    const channelData = this.buffer.getChannelData(0);
    channelData.reverse();
  }

  // --- Helpers ---

  private getMeasureDurationSeconds(): number {
    return getSecondsPerBeat(this.engine.config.bpm) * getBeatsPerMeasure(this.engine.config.timeSignature);
  }

  private restartPlayback(): void {
    if (this.state === 'playing') {
      this.stopSource();
      this.play();
    }
  }

  private getCurrentPlaybackSample(): number {
    if (!this.engine.audioContext || !this.buffer) return 0;
    const elapsed = this.engine.audioContext.currentTime - this.playbackStartTime;
    const rate = this.getEffectivePlaybackRate();
    const samples = Math.floor(elapsed * rate * this.engine.sampleRate);
    return samples % this.buffer.length;
  }

  private cloneBuffer(source: AudioBuffer): AudioBuffer {
    const ctx = this.engine.audioContext!;
    const clone = ctx.createBuffer(
      source.numberOfChannels,
      source.length,
      source.sampleRate
    );
    for (let ch = 0; ch < source.numberOfChannels; ch++) {
      clone.getChannelData(ch).set(source.getChannelData(ch));
    }
    return clone;
  }

  private updateWaveform(): void {
    if (!this.buffer) {
      this.waveformData = null;
      return;
    }
    const channelData = this.buffer.getChannelData(0);
    const samples = 200; // resolution for display
    const blockSize = Math.floor(channelData.length / samples);
    this.waveformData = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      let max = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        const abs = Math.abs(channelData[start + j] || 0);
        if (abs > max) max = abs;
      }
      this.waveformData[i] = max;
    }
  }

  getPlaybackProgress(): number {
    if (!this.buffer || this.state === 'empty' || this.state === 'stopped') return 0;
    if (!this.engine.audioContext) return 0;
    const elapsed = this.engine.audioContext.currentTime - this.playbackStartTime;
    const duration = this.buffer.duration / this.getEffectivePlaybackRate();
    return (elapsed % duration) / duration;
  }

  dispose(): void {
    this.stopSource();
    this.stopCapture();
    if (this.overdubProcessor) {
      this.overdubProcessor.disconnect();
      this.overdubProcessor = null;
    }
    this.fxChain?.dispose();
    this.gainNode?.disconnect();
    this.panNode?.disconnect();
    this.fadeGainNode?.disconnect();
    this.gainNode = null;
    this.panNode = null;
    this.fadeGainNode = null;
    this.fxChain = null;
  }
}
