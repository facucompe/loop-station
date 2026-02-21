'use client';

import { useLooper } from '@/context/LooperContext';
import { MetronomeControl } from '../Metronome/MetronomeControl';
import { MonitorControl } from './MonitorControl';
import { PlayMode, LoopLength, getBeatsPerMeasure } from '@/lib/audio/GlobalConfig';
import styles from './GlobalSettings.module.css';

export function GlobalSettings() {
  const { engine, tick } = useLooper();
  void tick;

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <span className={styles.label}>Play Mode</span>
        <select
          className={styles.select}
          value={engine.config.playMode}
          onChange={e => engine.updateConfig({ playMode: e.target.value as PlayMode })}
        >
          <option value="multi">Multi</option>
          <option value="single">Single</option>
        </select>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Loop Length</span>
        <select
          className={styles.select}
          value={String(engine.config.loopLength)}
          onChange={e => {
            const val = e.target.value;
            engine.updateConfig({
              loopLength: val === 'auto' ? 'auto' : Number(val) as LoopLength,
            });
          }}
        >
          <option value="auto">Auto</option>
          {[1, 2, 4, 8, 16, 32, 64].map(n => (
            <option key={n} value={n}>{n} measures</option>
          ))}
        </select>
      </div>

      <MetronomeControl />

      <MonitorControl />

      {engine.masterLoopLengthBeats !== null && (
        <div className={styles.field}>
          <span className={styles.masterLoop}>
            Master: {(() => {
              const b = engine.masterLoopLengthBeats;
              const bpm = getBeatsPerMeasure(engine.config.timeSignature);
              if (b >= bpm && b % bpm === 0) {
                const m = b / bpm;
                return `${m} measure${m !== 1 ? 's' : ''}`;
              }
              return `${b} beat${b !== 1 ? 's' : ''}`;
            })()}
          </span>
        </div>
      )}
    </div>
  );
}
