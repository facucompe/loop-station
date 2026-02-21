'use client';

import { useTransport } from '@/hooks/useTransport';
import { useLooper } from '@/context/LooperContext';
import { BpmControl } from './BpmControl';
import { BeatIndicator } from './BeatIndicator';
import { TimeSignature } from '@/lib/audio/GlobalConfig';
import styles from './TransportBar.module.css';

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8'];

export function TransportBar() {
  const { isRunning, start, stop, timeSignature, setTimeSignature } = useTransport();
  const { engine } = useLooper();

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <BpmControl />
        <BeatIndicator />
        <select
          className={styles.timeSig}
          value={timeSignature}
          onChange={e => setTimeSignature(e.target.value as TimeSignature)}
        >
          {TIME_SIGNATURES.map(ts => (
            <option key={ts} value={ts}>{ts}</option>
          ))}
        </select>
      </div>
      <div className={styles.right}>
        <button
          className={`${styles.transportBtn} ${isRunning ? styles.active : ''}`}
          onClick={() => isRunning ? stop() : start()}
        >
          {isRunning ? 'STOP' : 'START'}
        </button>
        <button
          className={`${styles.transportBtn} ${styles.stop}`}
          onClick={() => engine.stopAllTracks()}
        >
          STOP ALL
        </button>
      </div>
    </div>
  );
}
