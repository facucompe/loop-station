'use client';

import styles from './VolumeSlider.module.css';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function VolumeSlider({ value, onChange }: Props) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Vol</span>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className={styles.value}>{value}</span>
    </div>
  );
}
