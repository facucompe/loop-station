'use client';

import { useLooper } from '@/context/LooperContext';

export function useAudioEngine() {
  const { engine, isInitialized, hasMic, init } = useLooper();
  return { engine, isInitialized, hasMic, init };
}
