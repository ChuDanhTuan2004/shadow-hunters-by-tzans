import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY_VOLUME = "sh_music_volume";
const STORAGE_KEY_MUTED = "sh_music_muted";

const TRACKS: Record<string, string> = {
  lobby: "/assets/music/home-screen-music.mp3",
  waiting_room: "/assets/music/home-screen-music.mp3",
  character_select: "/assets/music/home-screen-music.mp3",
  playing: "/assets/music/home-screen-music.mp3",
};

export function useBackgroundMusic(view: string) {
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    return saved ? parseFloat(saved) : 0.3;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_MUTED) === "true";
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentViewRef = useRef(view);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(isMuted);

  volumeRef.current = volume;
  mutedRef.current = isMuted;

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_MUTED, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const src = TRACKS[view];
    if (!src) {
      audio.pause();
      return;
    }

    // Resolve relative path to absolute URL để so sánh chính xác với audio.src
    const resolvedSrc = new URL(src, window.location.href).href;
    const isSameTrack = audio.src === resolvedSrc;

    if (currentViewRef.current !== view) {
      if (!isSameTrack) {
        // Track khác → fade out rồi đổi nhạc
        audio.volume = 0;
        audio.src = src;
        audio.play().catch(() => { });
      }
      // Nếu cùng track (vd: lobby → waiting_room) thì không làm gì,
      // nhạc vẫn đang phát bình thường.
      currentViewRef.current = view;
    }

    const targetVolume = mutedRef.current ? 0 : volumeRef.current;

    let fadeInterval: ReturnType<typeof setInterval> | null = null;
    const fadeStep = 0.05;
    const fadeRate = 80;

    const currentVol = audio.volume;
    if (Math.abs(currentVol - targetVolume) > 0.01) {
      fadeInterval = setInterval(() => {
        if (!audioRef.current) {
          if (fadeInterval) clearInterval(fadeInterval);
          return;
        }
        const diff = targetVolume - audioRef.current.volume;
        if (Math.abs(diff) < fadeStep) {
          audioRef.current.volume = targetVolume;
          if (fadeInterval) clearInterval(fadeInterval);
        } else {
          audioRef.current.volume += Math.sign(diff) * fadeStep;
        }
      }, fadeRate);
    }

    return () => {
      if (fadeInterval) clearInterval(fadeInterval);
    };
  }, [view, volume, isMuted]);

  return { volume, setVolume, isMuted, toggleMute };
}
