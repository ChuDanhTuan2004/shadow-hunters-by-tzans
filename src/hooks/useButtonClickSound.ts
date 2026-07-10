import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY_MUTED = "sh_sfx_muted";
const STORAGE_KEY_VOLUME = "sh_sfx_volume";

const CLICKABLE_SELECTOR =
  'button, a, select, input:not([type="range"]):not([type="hidden"]), textarea, [role="button"], .cursor-pointer';

export function useButtonClickSound() {
  const [isSfxMuted, setIsSfxMuted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_MUTED) === "true";
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    return saved ? parseFloat(saved) : 0.5;
  });

  const isMutedRef = useRef(isSfxMuted);
  isMutedRef.current = isSfxMuted;
  const volumeRef = useRef(sfxVolume);
  volumeRef.current = sfxVolume;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/assets/music/button-click.mp3");
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest(CLICKABLE_SELECTOR);
      if (!clickable) return;
      if (isMutedRef.current) return;

      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.volume = volumeRef.current;
      audio.play().catch(() => {});
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  const toggleMute = useCallback(() => {
    setIsSfxMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_MUTED, String(next));
      return next;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setSfxVolume(clamped);
    localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
  }, []);

  return { isSfxMuted, toggleMute, sfxVolume, setVolume };
}
