'use client';

import { TrackState } from '@/lib/audio/TrackConfig';
import styles from './TrackControls.module.css';

const REC_KEYS = ['1', '2', '3', '4'];
const PLAY_KEYS = ['Q', 'W', 'E', 'R'];
const CLEAR_KEYS = ['A', 'S', 'D', 'F'];

interface Props {
  trackIndex: number;
  state: TrackState;
  canUndo: boolean;
  onToggleRecord: () => void;
  onTogglePlayStop: () => void;
  onClear: () => void;
  onUndo: () => void;
}

export function TrackControls({ trackIndex, state, canUndo, onToggleRecord, onTogglePlayStop, onClear, onUndo }: Props) {
  const recLabel = state === 'empty' ? 'REC' :
                   state === 'recording' ? 'STOP REC' :
                   state === 'overdubbing' ? 'STOP DUB' :
                   state === 'playing' ? 'DUB' : 'REC';

  const recClass = state === 'recording' ? styles.recording :
                   state === 'overdubbing' ? styles.overdubbing : '';

  return (
    <div className={styles.controls}>
      <button
        className={`${styles.recBtn} ${recClass}`}
        onClick={onToggleRecord}
      >
        {recLabel} <span className={styles.key}>{REC_KEYS[trackIndex]}</span>
      </button>
      <button
        className={`${styles.playBtn} ${state === 'playing' ? styles.playing : ''}`}
        onClick={onTogglePlayStop}
        disabled={state === 'empty' || state === 'recording'}
      >
        {state === 'playing' || state === 'overdubbing' ? 'STOP' : 'PLAY'} <span className={styles.key}>{PLAY_KEYS[trackIndex]}</span>
      </button>
      <button
        className={styles.undoBtn}
        onClick={onUndo}
        disabled={!canUndo}
      >
        UNDO
      </button>
      <button
        className={styles.clearBtn}
        onClick={onClear}
        disabled={state === 'empty'}
      >
        CLR <span className={styles.key}>{CLEAR_KEYS[trackIndex]}</span>
      </button>
    </div>
  );
}
