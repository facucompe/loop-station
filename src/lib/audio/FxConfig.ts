export interface ReverbConfig {
  enabled: boolean;
  mix: number;       // 0–1
  roomSize: number;  // 0–1
}

export interface DelayConfig {
  enabled: boolean;
  mix: number;       // 0–1
  time: number;      // 0–1 seconds
  feedback: number;  // 0–0.9
}

export interface DistortionConfig {
  enabled: boolean;
  mix: number;       // 0–1
  amount: number;    // 0–100
}

export interface FilterConfig {
  enabled: boolean;
  type: 'lowpass' | 'highpass';
  frequency: number;   // 20–20000 Hz
  resonance: number;   // 0–30
}

export interface CompressorConfig {
  enabled: boolean;
  threshold: number;   // -100–0 dB
  ratio: number;       // 1–20
}

export interface ChorusConfig {
  enabled: boolean;
  mix: number;       // 0–1
  rate: number;      // 0.1–10 Hz
  depth: number;     // 0–20 ms
}

export interface FxConfig {
  reverb: ReverbConfig;
  delay: DelayConfig;
  distortion: DistortionConfig;
  filter: FilterConfig;
  compressor: CompressorConfig;
  chorus: ChorusConfig;
}

export const DEFAULT_FX_CONFIG: FxConfig = {
  reverb: { enabled: false, mix: 0.3, roomSize: 0.5 },
  delay: { enabled: false, mix: 0.3, time: 0.3, feedback: 0.4 },
  distortion: { enabled: false, mix: 0.5, amount: 20 },
  filter: { enabled: false, type: 'lowpass', frequency: 1000, resonance: 1 },
  compressor: { enabled: false, threshold: -24, ratio: 4 },
  chorus: { enabled: false, mix: 0.3, rate: 1.5, depth: 5 },
};
