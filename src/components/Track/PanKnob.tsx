'use client';

import styles from './PanKnob.module.css';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function PanKnob({ value, onChange }: Props) {
  const display = value === 0 ? 'C' : value < 0 ? `L${Math.abs(value)}` : `R${value}`;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Pan</span>
      <input
        type="range"
        className={styles.slider}
        min={-100}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className={styles.value}>{display}</span>
    </div>
  );
}
