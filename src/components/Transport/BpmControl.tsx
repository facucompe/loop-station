'use client';

import { useRef, useCallback } from 'react';
import { useTransport } from '@/hooks/useTransport';
import styles from './BpmControl.module.css';

export function BpmControl() {
  const { bpm, setBpm } = useTransport();
  const tapTimesRef = useRef<number[]>([]);
  const dragRef = useRef<{ startX: number; startBpm: number } | null>(null);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    taps.push(now);

    // Keep last 4 taps
    if (taps.length > 4) taps.shift();

    // Reset if gap > 2s
    if (taps.length >= 2 && now - taps[taps.length - 2] > 2000) {
      tapTimesRef.current = [now];
      return;
    }

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      setBpm(newBpm);
    }
  }, [setBpm]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startBpm: bpm };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = (e.clientX - dragRef.current.startX) * 0.5;
      setBpm(Math.round(dragRef.current.startBpm + delta));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [bpm, setBpm]);

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.bpmDisplay} onMouseDown={handleMouseDown}>
          {bpm}
        </div>
        <div className={styles.bpmLabel}>BPM</div>
      </div>
      <div className={styles.bpmButtons}>
        <button className={styles.bpmBtn} onClick={() => setBpm(bpm + 1)}>+</button>
        <button className={styles.bpmBtn} onClick={() => setBpm(bpm - 1)}>-</button>
      </div>
      <button className={styles.tapBtn} onClick={handleTap}>TAP</button>
    </div>
  );
}
