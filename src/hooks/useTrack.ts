'use client';

import { useCallback } from 'react';
import { useLooper } from '@/context/LooperContext';
import { TrackConfig } from '@/lib/audio/TrackConfig';
import { FxConfig } from '@/lib/audio/FxConfig';

export function useTrack(index: number) {
  const { engine, tick } = useLooper();
  const track = engine.tracks[index];

  const toggleRecord = useCallback(() => {
    track.toggleRecord();
  }, [track]);

  const togglePlayStop = useCallback(() => {
    track.togglePlayStop();
  }, [track]);

  const stop = useCallback(() => {
    track.stop();
  }, [track]);

  const clear = useCallback(() => {
    track.clear();
  }, [track]);

  const undo = useCallback(() => {
    track.undo();
  }, [track]);

  const updateConfig = useCallback((partial: Partial<TrackConfig>) => {
    track.updateConfig(partial);
  }, [track]);

  const updateFxConfig = useCallback((partial: Partial<FxConfig>) => {
    track.updateFxConfig(partial);
  }, [track]);

  return {
    state: track.state,
    config: track.config,
    buffer: track.buffer,
    waveformData: track.waveformData,
    canUndo: track.canUndo,
    loopLengthBeats: track.loopLengthBeats,
    fxConfig: track.config.fx,
    toggleRecord,
    togglePlayStop,
    stop,
    clear,
    undo,
    updateConfig,
    updateFxConfig,
    tick,
  };
}
