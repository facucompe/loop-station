'use client';

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { AudioEngine } from '@/lib/audio/AudioEngine';

interface LooperContextValue {
  engine: AudioEngine;
  isInitialized: boolean;
  hasMic: boolean;
  init: () => Promise<void>;
  tick: number; // changes on every engine notify to trigger re-renders
}

const LooperContext = createContext<LooperContextValue | null>(null);

export function LooperProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<AudioEngine>(AudioEngine.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const engine = engineRef.current;
    const unsub = engine.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => {
      unsub();
    };
  }, []);

  const init = useCallback(async () => {
    const engine = engineRef.current;
    await engine.init();
    setIsInitialized(true);
    try {
      await engine.requestMic();
      setHasMic(true);
    } catch {
      console.warn('Microphone access denied');
    }
  }, []);

  return (
    <LooperContext.Provider value={{
      engine: engineRef.current,
      isInitialized,
      hasMic,
      init,
      tick,
    }}>
      {children}
    </LooperContext.Provider>
  );
}

export function useLooper(): LooperContextValue {
  const ctx = useContext(LooperContext);
  if (!ctx) throw new Error('useLooper must be used within LooperProvider');
  return ctx;
}
