'use client';

import { useTransport } from '@/hooks/useTransport';
import { getBeatsPerMeasure } from '@/lib/audio/GlobalConfig';
import styles from './BeatIndicator.module.css';

export function BeatIndicator() {
  const { beat, measure, timeSignature, isRunning } = useTransport();
  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

  return (
    <div className={styles.container}>
      {Array.from({ length: beatsPerMeasure }, (_, i) => (
        <div
          key={i}
          className={`${styles.dot} ${isRunning && beat === i ? (i === 0 ? styles.accent : styles.active) : ''}`}
        />
      ))}
      <div className={styles.measureCount}>{isRunning ? measure + 1 : '-'}</div>
    </div>
  );
}
