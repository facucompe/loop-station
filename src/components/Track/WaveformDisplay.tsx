'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './WaveformDisplay.module.css';

interface Props {
  waveformData: Float32Array | null;
  getProgress: () => number;
  isActive: boolean; // playing, overdubbing, or recording
  state: string;
}

export function WaveformDisplay({ waveformData, getProgress, isActive, state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Draw waveform on canvas (only when waveform data or state changes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    if (!waveformData || waveformData.length === 0) return;

    const barWidth = w / waveformData.length;
    const mid = h / 2;

    ctx.fillStyle = state === 'recording' ? '#e74c3c' :
                     state === 'overdubbing' ? '#f39c12' :
                     state === 'playing' ? '#2ecc71' : '#666';

    for (let i = 0; i < waveformData.length; i++) {
      const amp = waveformData[i] * mid * 0.9;
      ctx.fillRect(i * barWidth, mid - amp, Math.max(1, barWidth - 1), amp * 2);
    }
  }, [waveformData, state]);

  // Animate playhead with requestAnimationFrame
  useEffect(() => {
    if (!isActive) {
      if (playheadRef.current) {
        playheadRef.current.style.left = '0%';
      }
      return;
    }

    const animate = () => {
      if (playheadRef.current) {
        const progress = getProgress();
        playheadRef.current.style.left = `${progress * 100}%`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, getProgress]);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {isActive && <div ref={playheadRef} className={styles.playhead} />}
      {!waveformData && <div className={styles.emptyLabel}>Empty</div>}
    </div>
  );
}
