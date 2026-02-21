'use client';

import { useLooper } from '@/context/LooperContext';
import styles from './MetronomeControl.module.css';

export function MetronomeControl() {
  const { engine, tick } = useLooper();
  void tick;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Metro</span>
      <div
        className={`${styles.toggle} ${engine.config.metronomeOn ? styles.on : ''}`}
        onClick={() => engine.updateConfig({ metronomeOn: !engine.config.metronomeOn })}
      />
      <input
        type="range"
        className={styles.volume}
        min={0}
        max={100}
        value={engine.config.metronomeVolume}
        onChange={e => engine.updateConfig({ metronomeVolume: Number(e.target.value) })}
      />
    </div>
  );
}
