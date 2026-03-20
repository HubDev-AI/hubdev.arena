"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generates ambient cyberpunk music using Web Audio API synthesis.
 * Muted by default. The `onFrequencyData` callback sends analyser data
 * to any visualizer (like StatusBar).
 */
export function AmbientMusic({
  onFrequencyData,
}: {
  onFrequencyData?: (data: Uint8Array) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const animRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const startAudio = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    gainRef.current = masterGain;

    // Analyser for visualizer
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // === Ambient pad (warm drone) ===
    const padNotes = [55, 82.41, 110, 146.83]; // A1, E2, A2, D3
    padNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.06;

      // Slow LFO for movement
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.1 + Math.random() * 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      // Low-pass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;
      filter.Q.value = 1;

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      nodesRef.current.push(osc);
    });

    // === Shimmering high pad ===
    const shimmerNotes = [440, 554.37, 659.25]; // A4, C#5, E5
    shimmerNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0;

      // Fade in and out slowly
      const fadeLfo = ctx.createOscillator();
      fadeLfo.type = "sine";
      fadeLfo.frequency.value = 0.03 + i * 0.01;
      const fadeLfoGain = ctx.createGain();
      fadeLfoGain.gain.value = 0.015;
      fadeLfo.connect(fadeLfoGain);
      fadeLfoGain.connect(oscGain.gain);
      fadeLfo.start();

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 5;

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      nodesRef.current.push(osc);
    });

    // === Subtle rhythmic pulse (sub bass) ===
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = "sine";
    pulseOsc.frequency.value = 55;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0;

    // Rhythmic envelope
    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = "square";
    pulseLfo.frequency.value = 0.25; // Slow pulse every 4 seconds
    const pulseLfoGain = ctx.createGain();
    pulseLfoGain.gain.value = 0.04;
    pulseLfo.connect(pulseLfoGain);
    pulseLfoGain.connect(pulseGain.gain);
    pulseLfo.start();

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = "lowpass";
    subFilter.frequency.value = 100;

    pulseOsc.connect(subFilter);
    subFilter.connect(pulseGain);
    pulseGain.connect(masterGain);
    pulseOsc.start();
    nodesRef.current.push(pulseOsc);

    // === Random sparkle notes ===
    intervalRef.current = setInterval(() => {
      if (ctx.state !== "running") return;
      const sparkleFreqs = [880, 1108.73, 1318.51, 1760, 2217.46]; // A5, C#6, E6, A6, C#7
      const freq = sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)] ?? 880;

      const sparkle = ctx.createOscillator();
      sparkle.type = "sine";
      sparkle.frequency.value = freq;

      const sparkleGain = ctx.createGain();
      sparkleGain.gain.setValueAtTime(0.02, ctx.currentTime);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

      const sparkleFilter = ctx.createBiquadFilter();
      sparkleFilter.type = "highpass";
      sparkleFilter.frequency.value = 800;

      sparkle.connect(sparkleFilter);
      sparkleFilter.connect(sparkleGain);
      sparkleGain.connect(masterGain);
      sparkle.start();
      sparkle.stop(ctx.currentTime + 2.5);
    }, 3000 + Math.random() * 4000);

    // Analyser animation loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const sendData = () => {
      analyser.getByteFrequencyData(dataArray);
      onFrequencyData?.(dataArray);
      animRef.current = requestAnimationFrame(sendData);
    };
    sendData();

    setIsPlaying(true);
  }, [volume, onFrequencyData]);

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    nodesRef.current.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    nodesRef.current = [];

    ctxRef.current?.close();
    ctxRef.current = null;
    gainRef.current = null;
    analyserRef.current = null;

    setIsPlaying(false);
    onFrequencyData?.(new Uint8Array(32));
  }, [onFrequencyData]);

  // Update volume
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      nodesRef.current.forEach((osc) => {
        try { osc.stop(); } catch { /* already stopped */ }
      });
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isPlaying ? stopAudio : startAudio}
        className="flex h-8 w-8 items-center justify-center border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 text-[var(--accent-green)] transition-all hover:bg-[var(--accent-green)] hover:text-black"
        style={{ boxShadow: isPlaying ? "0 0 10px rgba(0, 255, 65, 0.2)" : "none" }}
        aria-label={isPlaying ? "Mute ambient music" : "Play ambient music"}
        title={isPlaying ? "Mute" : "Play ambient music"}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="4" height="10" rx="1" />
            <rect x="8" y="2" width="4" height="10" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5l9 5.5-9 5.5z" />
          </svg>
        )}
      </button>
      {isPlaying && (
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="h-1 w-16 cursor-pointer appearance-none bg-[var(--line)] accent-[var(--accent-green)] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-green)]"
          aria-label="Volume"
        />
      )}
    </div>
  );
}
