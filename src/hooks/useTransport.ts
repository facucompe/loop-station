'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLooper } from '@/context/LooperContext';

export function useTransport() {
  const { engine, tick } = useLooper();
  const [beat, setBeat] = useState(0);
  const [measure, setMeasure] = useState(0);

  useEffect(() => {
    const unsub = engine.transport.onTick((b, m) => {
      setBeat(b);
      setMeasure(m);
    });
    return unsub;
  }, [engine]);

  const start = useCallback(() => {
    engine.transport.start();
  }, [engine]);

  const stop = useCallback(() => {
    engine.transport.stop();
  }, [engine]);

  const setBpm = useCallback((bpm: number) => {
    engine.updateConfig({ bpm: Math.max(40, Math.min(300, bpm)) });
  }, [engine]);

  const setTimeSignature = useCallback((ts: '2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8') => {
    engine.updateConfig({ timeSignature: ts });
  }, [engine]);

  return {
    isRunning: engine.transport.isRunning,
    beat,
    measure,
    bpm: engine.config.bpm,
    timeSignature: engine.config.timeSignature,
    start,
    stop,
    setBpm,
    setTimeSignature,
    tick,
  };
}
