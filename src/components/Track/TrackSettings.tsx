'use client';

import { TrackConfig, RecAction, DubMode, StartMode, StopMode, LoopQuantize, TrackSpeed } from '@/lib/audio/TrackConfig';
import styles from './TrackSettings.module.css';

interface Props {
  trackIndex: number;
  config: TrackConfig;
  onUpdate: (partial: Partial<TrackConfig>) => void;
  onClose: () => void;
}

export function TrackSettings({ trackIndex, config, onUpdate, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>Track {trackIndex + 1} Settings</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Rec Action</span>
            <select
              className={styles.select}
              value={config.recAction}
              onChange={e => onUpdate({ recAction: e.target.value as RecAction })}
            >
              <option value="rec→dub→play">Rec → Dub → Play</option>
              <option value="rec→play→dub">Rec → Play → Dub</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Dub Mode</span>
            <select
              className={styles.select}
              value={config.dubMode}
              onChange={e => onUpdate({ dubMode: e.target.value as DubMode })}
            >
              <option value="overdub">Overdub</option>
              <option value="replace">Replace</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Start Mode</span>
            <select
              className={styles.select}
              value={config.startMode}
              onChange={e => onUpdate({ startMode: e.target.value as StartMode })}
            >
              <option value="immediate">Immediate</option>
              <option value="fade-in">Fade In</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Stop Mode</span>
            <select
              className={styles.select}
              value={config.stopMode}
              onChange={e => onUpdate({ stopMode: e.target.value as StopMode })}
            >
              <option value="immediate">Immediate</option>
              <option value="fade-out">Fade Out</option>
              <option value="loop-end">Loop End</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Fade Time (measures)</span>
            <select
              className={styles.select}
              value={config.fadeTime}
              onChange={e => onUpdate({ fadeTime: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Speed</span>
            <select
              className={styles.select}
              value={config.speed}
              onChange={e => onUpdate({ speed: Number(e.target.value) as TrackSpeed })}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Loop Quantize</span>
            <select
              className={styles.select}
              value={config.loopQuantize}
              onChange={e => onUpdate({ loopQuantize: e.target.value as LoopQuantize })}
            >
              <option value="off">Off</option>
              <option value="beat">Beat</option>
              <option value="measure">Measure</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>One Shot</span>
            <div className={styles.toggle}>
              <div
                className={`${styles.toggleSwitch} ${config.oneShot ? styles.on : ''}`}
                onClick={() => onUpdate({ oneShot: !config.oneShot })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Reverse</span>
            <div className={styles.toggle}>
              <div
                className={`${styles.toggleSwitch} ${config.reverse ? styles.on : ''}`}
                onClick={() => onUpdate({ reverse: !config.reverse })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tempo Sync</span>
            <div className={styles.toggle}>
              <div
                className={`${styles.toggleSwitch} ${config.tempoSync ? styles.on : ''}`}
                onClick={() => onUpdate({ tempoSync: !config.tempoSync })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Loop Sync</span>
            <div className={styles.toggle}>
              <div
                className={`${styles.toggleSwitch} ${config.loopSync ? styles.on : ''}`}
                onClick={() => onUpdate({ loopSync: !config.loopSync })}
              />
            </div>
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
