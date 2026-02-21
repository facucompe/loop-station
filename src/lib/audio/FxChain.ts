import { FxConfig, DEFAULT_FX_CONFIG } from './FxConfig';

/**
 * Reusable FX chain: input → Compressor → Distortion → Filter → Chorus → Delay → Reverb → output
 * Each effect has dry/wet mix and bypass capability.
 */
export class FxChain {
  private ctx: AudioContext;
  private _input: GainNode;
  private _output: GainNode;
  private config: FxConfig;

  // Compressor
  private compressorNode: DynamicsCompressorNode | null = null;
  private compressorBypass: GainNode | null = null;
  private compressorWet: GainNode | null = null;

  // Distortion
  private distortionNode: WaveShaperNode | null = null;
  private distortionDry: GainNode | null = null;
  private distortionWet: GainNode | null = null;
  private distortionMerge: GainNode | null = null;

  // Filter
  private filterNode: BiquadFilterNode | null = null;
  private filterBypass: GainNode | null = null;
  private filterWet: GainNode | null = null;

  // Chorus
  private chorusDelay: DelayNode | null = null;
  private chorusLfo: OscillatorNode | null = null;
  private chorusLfoGain: GainNode | null = null;
  private chorusDry: GainNode | null = null;
  private chorusWet: GainNode | null = null;
  private chorusMerge: GainNode | null = null;

  // Delay
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayDry: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private delayMerge: GainNode | null = null;

  // Reverb
  private reverbNode: ConvolverNode | null = null;
  private reverbDry: GainNode | null = null;
  private reverbWet: GainNode | null = null;
  private reverbMerge: GainNode | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.config = JSON.parse(JSON.stringify(DEFAULT_FX_CONFIG));
    this._input = ctx.createGain();
    this._output = ctx.createGain();
    this.buildChain();
  }

  get input(): GainNode {
    return this._input;
  }

  get output(): GainNode {
    return this._output;
  }

  private buildChain(): void {
    const ctx = this.ctx;

    // === Compressor ===
    this.compressorNode = ctx.createDynamicsCompressor();
    this.compressorBypass = ctx.createGain();
    this.compressorWet = ctx.createGain();
    const compOut = ctx.createGain();

    this._input.connect(this.compressorBypass);
    this._input.connect(this.compressorNode);
    this.compressorNode.connect(this.compressorWet);
    this.compressorBypass.connect(compOut);
    this.compressorWet.connect(compOut);

    // === Distortion ===
    this.distortionNode = ctx.createWaveShaper();
    this.distortionDry = ctx.createGain();
    this.distortionWet = ctx.createGain();
    this.distortionMerge = ctx.createGain();

    compOut.connect(this.distortionDry);
    compOut.connect(this.distortionNode);
    this.distortionNode.connect(this.distortionWet);
    this.distortionDry.connect(this.distortionMerge);
    this.distortionWet.connect(this.distortionMerge);

    // === Filter ===
    this.filterNode = ctx.createBiquadFilter();
    this.filterBypass = ctx.createGain();
    this.filterWet = ctx.createGain();
    const filterOut = ctx.createGain();

    this.distortionMerge.connect(this.filterBypass);
    this.distortionMerge.connect(this.filterNode);
    this.filterNode.connect(this.filterWet);
    this.filterBypass.connect(filterOut);
    this.filterWet.connect(filterOut);

    // === Chorus ===
    this.chorusDelay = ctx.createDelay(0.05);
    this.chorusLfo = ctx.createOscillator();
    this.chorusLfoGain = ctx.createGain();
    this.chorusDry = ctx.createGain();
    this.chorusWet = ctx.createGain();
    this.chorusMerge = ctx.createGain();

    this.chorusLfo.connect(this.chorusLfoGain);
    this.chorusLfoGain.connect(this.chorusDelay.delayTime);
    this.chorusDelay.delayTime.value = 0.005; // base delay
    this.chorusLfo.start();

    filterOut.connect(this.chorusDry);
    filterOut.connect(this.chorusDelay);
    this.chorusDelay.connect(this.chorusWet);
    this.chorusDry.connect(this.chorusMerge);
    this.chorusWet.connect(this.chorusMerge);

    // === Delay ===
    this.delayNode = ctx.createDelay(2.0);
    this.delayFeedback = ctx.createGain();
    this.delayDry = ctx.createGain();
    this.delayWet = ctx.createGain();
    this.delayMerge = ctx.createGain();

    this.chorusMerge.connect(this.delayDry);
    this.chorusMerge.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayDry.connect(this.delayMerge);
    this.delayWet.connect(this.delayMerge);

    // === Reverb ===
    this.reverbNode = ctx.createConvolver();
    this.reverbDry = ctx.createGain();
    this.reverbWet = ctx.createGain();
    this.reverbMerge = ctx.createGain();

    this.delayMerge.connect(this.reverbDry);
    this.delayMerge.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbWet);
    this.reverbDry.connect(this.reverbMerge);
    this.reverbWet.connect(this.reverbMerge);

    this.reverbMerge.connect(this._output);

    // Generate initial impulse response and apply defaults
    this.updateReverbIR();
    this.applyConfig();
  }

  updateConfig(partial: Partial<FxConfig>): void {
    if (partial.reverb) this.config.reverb = { ...this.config.reverb, ...partial.reverb };
    if (partial.delay) this.config.delay = { ...this.config.delay, ...partial.delay };
    if (partial.distortion) this.config.distortion = { ...this.config.distortion, ...partial.distortion };
    if (partial.filter) this.config.filter = { ...this.config.filter, ...partial.filter };
    if (partial.compressor) this.config.compressor = { ...this.config.compressor, ...partial.compressor };
    if (partial.chorus) this.config.chorus = { ...this.config.chorus, ...partial.chorus };

    if (partial.reverb?.roomSize !== undefined) {
      this.updateReverbIR();
    }

    this.applyConfig();
  }

  getConfig(): FxConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  private applyConfig(): void {
    const c = this.config;

    // Compressor: bypass = on means wet, off means dry
    if (c.compressor.enabled) {
      this.compressorBypass!.gain.value = 0;
      this.compressorWet!.gain.value = 1;
      this.compressorNode!.threshold.value = c.compressor.threshold;
      this.compressorNode!.ratio.value = c.compressor.ratio;
    } else {
      this.compressorBypass!.gain.value = 1;
      this.compressorWet!.gain.value = 0;
    }

    // Distortion
    if (c.distortion.enabled) {
      this.distortionDry!.gain.value = 1 - c.distortion.mix;
      this.distortionWet!.gain.value = c.distortion.mix;
      this.distortionNode!.curve = this.makeDistortionCurve(c.distortion.amount);
      this.distortionNode!.oversample = '4x';
    } else {
      this.distortionDry!.gain.value = 1;
      this.distortionWet!.gain.value = 0;
    }

    // Filter: bypass/wet toggle
    if (c.filter.enabled) {
      this.filterBypass!.gain.value = 0;
      this.filterWet!.gain.value = 1;
      this.filterNode!.type = c.filter.type;
      this.filterNode!.frequency.value = c.filter.frequency;
      this.filterNode!.Q.value = c.filter.resonance;
    } else {
      this.filterBypass!.gain.value = 1;
      this.filterWet!.gain.value = 0;
    }

    // Chorus
    if (c.chorus.enabled) {
      this.chorusDry!.gain.value = 1 - c.chorus.mix;
      this.chorusWet!.gain.value = c.chorus.mix;
      this.chorusLfo!.frequency.value = c.chorus.rate;
      this.chorusLfoGain!.gain.value = c.chorus.depth / 1000; // ms to seconds
    } else {
      this.chorusDry!.gain.value = 1;
      this.chorusWet!.gain.value = 0;
    }

    // Delay
    if (c.delay.enabled) {
      this.delayDry!.gain.value = 1 - c.delay.mix;
      this.delayWet!.gain.value = c.delay.mix;
      this.delayNode!.delayTime.value = c.delay.time;
      this.delayFeedback!.gain.value = c.delay.feedback;
    } else {
      this.delayDry!.gain.value = 1;
      this.delayWet!.gain.value = 0;
      this.delayFeedback!.gain.value = 0;
    }

    // Reverb
    if (c.reverb.enabled) {
      this.reverbDry!.gain.value = 1 - c.reverb.mix;
      this.reverbWet!.gain.value = c.reverb.mix;
    } else {
      this.reverbDry!.gain.value = 1;
      this.reverbWet!.gain.value = 0;
    }
  }

  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    const k = amount;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private updateReverbIR(): void {
    const duration = 0.5 + this.config.reverb.roomSize * 3; // 0.5 to 3.5 seconds
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.reverbNode!.buffer = impulse;
  }

  dispose(): void {
    this.chorusLfo?.stop();
    this._input.disconnect();
    this._output.disconnect();
  }
}
