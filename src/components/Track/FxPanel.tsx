'use client';

import { FxConfig } from '@/lib/audio/FxConfig';
import styles from './FxPanel.module.css';

interface Props {
  trackIndex: number;
  fxConfig: FxConfig;
  onUpdate: (partial: Partial<FxConfig>) => void;
  onClose: () => void;
}

export function FxPanel({ trackIndex, fxConfig, onUpdate, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>Track {trackIndex + 1} FX</div>

        <div className={styles.fxGrid}>
          {/* Compressor */}
          <div className={`${styles.fxSlot} ${fxConfig.compressor.enabled ? styles.active : ''}`}>
            <div className={styles.fxHeader}>
              <span className={styles.fxName}>Compressor</span>
              <div
                className={`${styles.fxToggle} ${fxConfig.compressor.enabled ? styles.on : ''}`}
                onClick={() => onUpdate({ compressor: { ...fxConfig.compressor, enabled: !fxConfig.compressor.enabled } })}
              />
            </div>
            <div className={styles.fxParams}>
              <label className={styles.paramLabel}>
                Threshold
                <input
                  type="range" min={-100} max={0} step={1}
                  value={fxConfig.compressor.threshold}
                  onChange={e => onUpdate({ compressor: { ...fxConfig.compressor, threshold: Number(e.target.value) } })}
                />
                <span className={styles.paramValue}>{fxConfig.compressor.threshold}dB</span>
              </label>
              <label className={styles.paramLabel}>
                Ratio
                <input
                  type="range" min={1} max={20} step={0.5}
                  value={fxConfig.compressor.ratio}
                  onChange={e => onUpdate({ compressor: { ...fxConfig.compressor, ratio: Number(e.target.value) } })}
                />
                <span className={styles.paramValue}>{fxConfig.compressor.ratio}:1</span>
              </label>
            </div>
          </div>

          {/* Distortion */}
          <div className={`${styles.fxSlot} ${fxConfig.distortion.enabled ? styles.active : ''}`}>
            <div className={styles.fxHeader}>
              <span className={styles.fxName}>Distortion</span>
              <div
                className={`${styles.fxToggle} ${fxConfig.distortion.enabled ? styles.on : ''}`}
                onClick={() => onUpdate({ distortion: { ...fxConfig.distortion, enabled: !fxConfig.distortion.enabled } })}
              />
            </div>
            <div className={styles.fxParams}>
              <label className={styles.paramLabel}>
                Amount
                <input
                  type="range" min={0} max={100} step={1}
                  value={fxConfig.distortion.amount}
                  onChange={e => onUpdate({ distortion: { ...fxConfig.distortion, amount: Number(e.target.value) } })}
                />
                <span className={styles.paramValue}>{fxConfig.distortion.amount}</span>
              </label>
              <label className={styles.paramLabel}>
                Mix
                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(fxConfig.distortion.mix * 100)}
                  onChange={e => onUpdate({ distortion: { ...fxConfig.distortion, mix: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{Math.round(fxConfig.distortion.mix * 100)}%</span>
              </label>
            </div>
          </div>

          {/* Filter */}
          <div className={`${styles.fxSlot} ${fxConfig.filter.enabled ? styles.active : ''}`}>
            <div className={styles.fxHeader}>
              <span className={styles.fxName}>Filter</span>
              <div
                className={`${styles.fxToggle} ${fxConfig.filter.enabled ? styles.on : ''}`}
                onClick={() => onUpdate({ filter: { ...fxConfig.filter, enabled: !fxConfig.filter.enabled } })}
              />
            </div>
            <div className={styles.fxParams}>
              <label className={styles.paramLabel}>
                Type
                <select
                  className={styles.paramSelect}
                  value={fxConfig.filter.type}
                  onChange={e => onUpdate({ filter: { ...fxConfig.filter, type: e.target.value as 'lowpass' | 'highpass' } })}
                >
                  <option value="lowpass">LP</option>
                  <option value="highpass">HP</option>
                </select>
              </label>
              <label className={styles.paramLabel}>
                Freq
                <input
                  type="range" min={20} max={20000} step={1}
                  value={fxConfig.filter.frequency}
                  onChange={e => onUpdate({ filter: { ...fxConfig.filter, frequency: Number(e.target.value) } })}
                />
                <span className={styles.paramValue}>{fxConfig.filter.frequency >= 1000 ? `${(fxConfig.filter.frequency / 1000).toFixed(1)}k` : fxConfig.filter.frequency}Hz</span>
              </label>
              <label className={styles.paramLabel}>
                Res
                <input
                  type="range" min={0} max={30} step={0.5}
                  value={fxConfig.filter.resonance}
                  onChange={e => onUpdate({ filter: { ...fxConfig.filter, resonance: Number(e.target.value) } })}
                />
                <span className={styles.paramValue}>{fxConfig.filter.resonance}</span>
              </label>
            </div>
          </div>

          {/* Chorus */}
          <div className={`${styles.fxSlot} ${fxConfig.chorus.enabled ? styles.active : ''}`}>
            <div className={styles.fxHeader}>
              <span className={styles.fxName}>Chorus</span>
              <div
                className={`${styles.fxToggle} ${fxConfig.chorus.enabled ? styles.on : ''}`}
                onClick={() => onUpdate({ chorus: { ...fxConfig.chorus, enabled: !fxConfig.chorus.enabled } })}
              />
            </div>
            <div className={styles.fxParams}>
              <label className={styles.paramLabel}>
                Rate
                <input
                  type="range" min={1} max={100} step={1}
                  value={Math.round(fxConfig.chorus.rate * 10)}
                  onChange={e => onUpdate({ chorus: { ...fxConfig.chorus, rate: Number(e.target.value) / 10 } })}
                />
                <span className={styles.paramValue}>{fxConfig.chorus.rate.toFixed(1)}Hz</span>
              </label>
              <label className={styles.paramLabel}>
                Depth
                <input
                  type="range" min={0} max={20} step={0.5}
                  value={fxConfig.chorus.depth}
                  onChange={e => onUpdate({ chorus: { ...fxConfig.chorus, depth: Number(e.target.value) } })}
                />
                <span className={styles.paramValue}>{fxConfig.chorus.depth}ms</span>
              </label>
              <label className={styles.paramLabel}>
                Mix
                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(fxConfig.chorus.mix * 100)}
                  onChange={e => onUpdate({ chorus: { ...fxConfig.chorus, mix: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{Math.round(fxConfig.chorus.mix * 100)}%</span>
              </label>
            </div>
          </div>

          {/* Delay */}
          <div className={`${styles.fxSlot} ${fxConfig.delay.enabled ? styles.active : ''}`}>
            <div className={styles.fxHeader}>
              <span className={styles.fxName}>Delay</span>
              <div
                className={`${styles.fxToggle} ${fxConfig.delay.enabled ? styles.on : ''}`}
                onClick={() => onUpdate({ delay: { ...fxConfig.delay, enabled: !fxConfig.delay.enabled } })}
              />
            </div>
            <div className={styles.fxParams}>
              <label className={styles.paramLabel}>
                Time
                <input
                  type="range" min={1} max={100} step={1}
                  value={Math.round(fxConfig.delay.time * 100)}
                  onChange={e => onUpdate({ delay: { ...fxConfig.delay, time: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{(fxConfig.delay.time * 1000).toFixed(0)}ms</span>
              </label>
              <label className={styles.paramLabel}>
                Feedback
                <input
                  type="range" min={0} max={90} step={1}
                  value={Math.round(fxConfig.delay.feedback * 100)}
                  onChange={e => onUpdate({ delay: { ...fxConfig.delay, feedback: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{Math.round(fxConfig.delay.feedback * 100)}%</span>
              </label>
              <label className={styles.paramLabel}>
                Mix
                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(fxConfig.delay.mix * 100)}
                  onChange={e => onUpdate({ delay: { ...fxConfig.delay, mix: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{Math.round(fxConfig.delay.mix * 100)}%</span>
              </label>
            </div>
          </div>

          {/* Reverb */}
          <div className={`${styles.fxSlot} ${fxConfig.reverb.enabled ? styles.active : ''}`}>
            <div className={styles.fxHeader}>
              <span className={styles.fxName}>Reverb</span>
              <div
                className={`${styles.fxToggle} ${fxConfig.reverb.enabled ? styles.on : ''}`}
                onClick={() => onUpdate({ reverb: { ...fxConfig.reverb, enabled: !fxConfig.reverb.enabled } })}
              />
            </div>
            <div className={styles.fxParams}>
              <label className={styles.paramLabel}>
                Room
                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(fxConfig.reverb.roomSize * 100)}
                  onChange={e => onUpdate({ reverb: { ...fxConfig.reverb, roomSize: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{Math.round(fxConfig.reverb.roomSize * 100)}%</span>
              </label>
              <label className={styles.paramLabel}>
                Mix
                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(fxConfig.reverb.mix * 100)}
                  onChange={e => onUpdate({ reverb: { ...fxConfig.reverb, mix: Number(e.target.value) / 100 } })}
                />
                <span className={styles.paramValue}>{Math.round(fxConfig.reverb.mix * 100)}%</span>
              </label>
            </div>
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
