"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { StatusBar } from "@/components/status-bar";

type AudioPreset = "ambient" | "battle";

/**
 * Layout: [Play button] [Status bar animation]
 *                        [Volume slider (below bars, only when playing)]
 *
 * preset="ambient" (default) — warm drone pad with shimmer harmonics
 * preset="battle" — darker, more intense synth with faster pulse
 */
export function MusicVisualizer({ className = "", preset = "ambient" }: { className?: string; preset?: AudioPreset }) {
  const [freqData, setFreqData] = useState<Uint8Array | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const animRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  // L43: Use a ref for volume to avoid stale closure in startAudio
  const volumeRef = useRef(volume);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // L43: Keep volumeRef in sync
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const startAudio = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    // L43: Use ref for current volume value
    masterGain.gain.value = volumeRef.current;
    gainRef.current = masterGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    if (preset === "battle") {
      // === Battle preset: darker, more intense ===

      // Deep sawtooth drone (minor key — A2, C3, E3, G3)
      [110, 130.81, 164.81, 196].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0.035;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.15 + Math.random() * 0.2;
        const lg = ctx.createGain();
        lg.gain.value = 3;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start();
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 300;
        f.Q.value = 3;
        osc.connect(f);
        f.connect(g);
        g.connect(masterGain);
        osc.start();
        nodesRef.current.push(osc);
      });

      // Tense high harmonics (minor intervals)
      [523.25, 622.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.05 + i * 0.015;
        const lg = ctx.createGain();
        lg.gain.value = 0.012;
        lfo.connect(lg);
        lg.connect(g.gain);
        lfo.start();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = freq;
        f.Q.value = 8;
        osc.connect(f);
        f.connect(g);
        g.connect(masterGain);
        osc.start();
        nodesRef.current.push(osc);
      });

      // Driving sub-bass pulse (faster than ambient)
      const pulse = ctx.createOscillator();
      pulse.type = "sine";
      pulse.frequency.value = 55;
      const pg = ctx.createGain();
      pg.gain.value = 0;
      const plfo = ctx.createOscillator();
      plfo.type = "square";
      plfo.frequency.value = 0.5; // Twice as fast as ambient
      const plg = ctx.createGain();
      plg.gain.value = 0.05;
      plfo.connect(plg);
      plg.connect(pg.gain);
      plfo.start();
      const pf = ctx.createBiquadFilter();
      pf.type = "lowpass";
      pf.frequency.value = 80;
      pulse.connect(pf);
      pf.connect(pg);
      pg.connect(masterGain);
      pulse.start();
      nodesRef.current.push(pulse);

      // Aggressive sparkles (lower, more frequent)
      intervalRef.current = setInterval(() => {
        if (ctx.state !== "running") return;
        const freqs = [659.25, 783.99, 987.77, 1174.66, 1318.51];
        const sf = freqs[Math.floor(Math.random() * freqs.length)] ?? 659.25;
        const s = ctx.createOscillator();
        s.type = "sawtooth";
        s.frequency.value = sf;
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.018, ctx.currentTime);
        sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        const sf2 = ctx.createBiquadFilter();
        sf2.type = "bandpass";
        sf2.frequency.value = sf;
        sf2.Q.value = 10;
        s.connect(sf2);
        sf2.connect(sg);
        sg.connect(masterGain);
        s.start();
        s.stop(ctx.currentTime + 1.5);
      }, 2000 + Math.random() * 2500);
    } else {
      // === Ambient preset: warm drone ===

      // Warm drone pad
      [55, 82.41, 110, 146.83].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0.06;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.1 + Math.random() * 0.15;
        const lg = ctx.createGain();
        lg.gain.value = 2;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start();
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 400;
        osc.connect(f);
        f.connect(g);
        g.connect(masterGain);
        osc.start();
        nodesRef.current.push(osc);
      });

      // Shimmer harmonics
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.03 + i * 0.01;
        const lg = ctx.createGain();
        lg.gain.value = 0.015;
        lfo.connect(lg);
        lg.connect(g.gain);
        lfo.start();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = freq;
        f.Q.value = 5;
        osc.connect(f);
        f.connect(g);
        g.connect(masterGain);
        osc.start();
        nodesRef.current.push(osc);
      });

      // Sub bass pulse
      const pulse = ctx.createOscillator();
      pulse.type = "sine";
      pulse.frequency.value = 55;
      const pg = ctx.createGain();
      pg.gain.value = 0;
      const plfo = ctx.createOscillator();
      plfo.type = "square";
      plfo.frequency.value = 0.25;
      const plg = ctx.createGain();
      plg.gain.value = 0.04;
      plfo.connect(plg);
      plg.connect(pg.gain);
      plfo.start();
      const pf = ctx.createBiquadFilter();
      pf.type = "lowpass";
      pf.frequency.value = 100;
      pulse.connect(pf);
      pf.connect(pg);
      pg.connect(masterGain);
      pulse.start();
      nodesRef.current.push(pulse);

      // Random sparkles
      intervalRef.current = setInterval(() => {
        if (ctx.state !== "running") return;
        const freqs = [880, 1108.73, 1318.51, 1760, 2217.46];
        const sf = freqs[Math.floor(Math.random() * freqs.length)] ?? 880;
        const s = ctx.createOscillator();
        s.type = "sine";
        s.frequency.value = sf;
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.02, ctx.currentTime);
        sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        s.connect(sg);
        sg.connect(masterGain);
        s.start();
        s.stop(ctx.currentTime + 2.5);
      }, 3000 + Math.random() * 4000);
    }

    // Feed analyser data
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      setFreqData(new Uint8Array(buf));
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    setIsPlaying(true);
  }, [preset]);

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    nodesRef.current.forEach((o) => { try { o.stop(); } catch { /* */ } });
    nodesRef.current = [];
    ctxRef.current?.close();
    ctxRef.current = null;
    gainRef.current = null;
    analyserRef.current = null;
    setIsPlaying(false);
    setFreqData(null);
  }, []);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      nodesRef.current.forEach((o) => { try { o.stop(); } catch { /* */ } });
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {/* Play/pause — left */}
      <button
        type="button"
        onClick={isPlaying ? stopAudio : startAudio}
        className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 text-[var(--accent-green)] transition-all hover:bg-[var(--accent-green)] hover:text-black"
        style={{ boxShadow: isPlaying ? "0 0 10px rgba(0, 255, 65, 0.2)" : "none" }}
        // L42: Standardize aria-label — "Pause music" / "Play music"
        aria-label={isPlaying ? "Pause music" : "Play music"}
        title={isPlaying ? "Pause" : "Play music"}
      >
        {isPlaying ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="1" y="1" width="3" height="8" rx="0.5" />
            <rect x="6" y="1" width="3" height="8" rx="0.5" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2 0.5l7 4.5-7 4.5z" />
          </svg>
        )}
      </button>

      {/* Bars + volume stacked — fixed width so slider matches bars exactly */}
      <div className="flex w-[100px] flex-col gap-1">
        {/* H21: Static bars when prefers-reduced-motion */}
        <StatusBar frequencyData={prefersReducedMotion && !isPlaying ? undefined : freqData} className="flex" prefersReducedMotion={prefersReducedMotion} />
        {isPlaying && (
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="h-[2px] w-[100px] cursor-pointer appearance-none bg-[var(--line)] [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-green)]"
            aria-label="Volume"
          />
        )}
      </div>
    </div>
  );
}
