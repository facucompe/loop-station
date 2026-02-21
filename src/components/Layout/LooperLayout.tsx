'use client';

import { useEffect, useCallback } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useLooper } from '@/context/LooperContext';
import { TransportBar } from '../Transport/TransportBar';
import { GlobalSettings } from '../Settings/GlobalSettings';
import { TrackChannel } from '../Track/TrackChannel';
import styles from './LooperLayout.module.css';

export function LooperLayout() {
  const { isInitialized, init } = useAudioEngine();
  const { engine } = useLooper();

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isInitialized) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

    switch (e.key) {
      case '1': case '2': case '3': case '4': {
        const idx = parseInt(e.key) - 1;
        engine.tracks[idx].toggleRecord();
        break;
      }
      case 'q': case 'w': case 'e': case 'r': {
        const idx = { q: 0, w: 1, e: 2, r: 3 }[e.key]!;
        engine.tracks[idx].togglePlayStop();
        break;
      }
      case 'a': case 's': case 'd': case 'f': {
        const idx = { a: 0, s: 1, d: 2, f: 3 }[e.key]!;
        engine.tracks[idx].clear();
        break;
      }
      case ' ':
        e.preventDefault();
        if (engine.transport.isRunning) {
          engine.transport.stop();
        } else {
          engine.transport.start();
        }
        break;
      case 'Escape':
        engine.stopAllTracks();
        break;
    }
  }, [isInitialized, engine]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isInitialized) {
    return (
      <div className={styles.initOverlay}>
        <div className={styles.title}>RC-505 MK2</div>
        <div className={styles.subtitle}>Web Loop Station</div>
        <button className={styles.startBtn} onClick={init}>
          Start
        </button>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <TransportBar />
      <GlobalSettings />
      <div className={styles.tracks}>
        {[0, 1, 2, 3].map(i => (
          <TrackChannel key={i} index={i} />
        ))}
      </div>
      <div className={styles.shortcuts}>
        1-4: Record/Dub | Q/W/E/R: Play/Stop | A/S/D/F: Clear | Space: Transport | Esc: Stop All
      </div>
    </div>
  );
}
