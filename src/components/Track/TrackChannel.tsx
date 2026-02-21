'use client';

import { useState, useCallback } from 'react';
import { useTrack } from '@/hooks/useTrack';
import { useLooper } from '@/context/LooperContext';
import { getBeatsPerMeasure } from '@/lib/audio/GlobalConfig';
import { WaveformDisplay } from './WaveformDisplay';
import { TrackControls } from './TrackControls';
import { VolumeSlider } from './VolumeSlider';
import { PanKnob } from './PanKnob';
import { TrackSettings } from './TrackSettings';
import { FxPanel } from './FxPanel';
import styles from './TrackChannel.module.css';

function formatLoopLength(beats: number, beatsPerMeasure: number): string {
  if (beats <= 0) return '';
  if (beats >= beatsPerMeasure && beats % beatsPerMeasure === 0) {
    const measures = beats / beatsPerMeasure;
    return `${measures} measure${measures !== 1 ? 's' : ''}`;
  }
  return `${beats} beat${beats !== 1 ? 's' : ''}`;
}

interface Props {
  index: number;
}

export function TrackChannel({ index }: Props) {
  const {
    state, config, waveformData, canUndo, loopLengthBeats, fxConfig,
    toggleRecord, togglePlayStop, clear, undo, updateConfig, updateFxConfig,
  } = useTrack(index);
  const { engine } = useLooper();

  const [showSettings, setShowSettings] = useState(false);
  const [showFx, setShowFx] = useState(false);

  const getProgress = useCallback(() => {
    return engine.tracks[index].getPlaybackProgress();
  }, [engine, index]);

  const isActive = state === 'playing' || state === 'overdubbing' || state === 'recording';

  const stateClass = state === 'recording' ? styles.recording :
                     state === 'playing' ? styles.playing :
                     state === 'overdubbing' ? styles.overdubbing : '';

  const beatsPerMeasure = getBeatsPerMeasure(engine.config.timeSignature);

  const hasActiveFx = fxConfig.compressor.enabled || fxConfig.distortion.enabled ||
    fxConfig.filter.enabled || fxConfig.chorus.enabled ||
    fxConfig.delay.enabled || fxConfig.reverb.enabled;

  return (
    <>
      <div className={`${styles.channel} ${stateClass}`}>
        <div className={styles.header}>
          <span className={styles.trackLabel}>Track {index + 1}</span>
          <span className={`${styles.stateLabel} ${stateClass}`}>{state}</span>
          <div className={styles.headerButtons}>
            <button
              className={`${styles.fxBtn} ${hasActiveFx ? styles.fxActive : ''}`}
              onClick={() => setShowFx(true)}
            >
              FX
            </button>
            <button className={styles.settingsBtn} onClick={() => setShowSettings(true)}>
              SETTINGS
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.waveformArea}>
            <WaveformDisplay
              waveformData={waveformData}
              getProgress={getProgress}
              isActive={isActive}
              state={state}
            />
          </div>
          <div className={styles.mixControls}>
            <VolumeSlider
              value={config.playLevel}
              onChange={v => updateConfig({ playLevel: v })}
            />
            <PanKnob
              value={config.pan}
              onChange={v => updateConfig({ pan: v })}
            />
          </div>
        </div>

        <TrackControls
          trackIndex={index}
          state={state}
          canUndo={canUndo}
          onToggleRecord={toggleRecord}
          onTogglePlayStop={togglePlayStop}
          onClear={clear}
          onUndo={undo}
        />

        {loopLengthBeats > 0 && (
          <div className={styles.info}>{formatLoopLength(loopLengthBeats, beatsPerMeasure)}</div>
        )}
      </div>

      {showSettings && (
        <TrackSettings
          trackIndex={index}
          config={config}
          onUpdate={updateConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showFx && (
        <FxPanel
          trackIndex={index}
          fxConfig={fxConfig}
          onUpdate={updateFxConfig}
          onClose={() => setShowFx(false)}
        />
      )}
    </>
  );
}
