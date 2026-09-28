import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Looping ambient audio plus a countdown timer. Audio files are only downloaded on first play
 * and stop automatically when the session ends or the component unmounts.
 */
export function useAmbientSession(sources, durationSeconds) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  const getAudio = useCallback(() => {
    audioRef.current ??= sources.map((src) => {
      const audio = new Audio(src);
      audio.loop = true;
      return audio;
    });
    return audioRef.current;
  }, [sources]);

  useEffect(() => {
    audioRef.current?.forEach((audio) => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  const pause = useCallback(() => {
    audioRef.current?.forEach((audio) => audio.pause());
    setIsPlaying(false);
  }, []);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const next = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(next);
      if (next === 0) pause(); // session finished
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, pause]);

  // Stop sound when the game closes.
  useEffect(
    () => () => {
      audioRef.current?.forEach((audio) => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      });
      audioRef.current = null;
    },
    [],
  );

  const play = useCallback(async () => {
    if (timeLeft === 0) setTimeLeft(durationSeconds);
    const audio = getAudio();
    audio.forEach((a) => {
      a.volume = volume / 100;
    });
    setIsPlaying(true);
    try {
      await Promise.all(audio.map((a) => a.play()));
    } catch {
      // Autoplay can be blocked; the timer still runs.
    }
  }, [durationSeconds, getAudio, timeLeft, volume]);

  const toggle = () => (isPlaying ? pause() : play());
  const progress = ((durationSeconds - timeLeft) / durationSeconds) * 100;

  return { isPlaying, toggle, volume, setVolume, timeLeft, progress };
}

export const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
