'use client';

import { useLooper } from '@/context/LooperContext';
import styles from './MonitorControl.module.css';

export function MonitorControl() {
  const { engine, tick } = useLooper();
  void tick;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.toggle} ${engine.config.monitorOn ? styles.on : ''}`}
        onClick={() => engine.updateConfig({ monitorOn: !engine.config.monitorOn })}
      >
        <span className={styles.label}>MON</span>
      </div>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={100}
        value={engine.config.monitorVolume}
        onChange={e => engine.updateConfig({ monitorVolume: Number(e.target.value) })}
      />
      <span className={styles.value}>{engine.config.monitorVolume}</span>
    </div>
  );
}
