"use client";

import { useRef, useState, useEffect } from "react";
import type ReactPlayer from "react-player";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";

interface VideoPlayerProps {
  videoSrc: string;
  posterSrc?: string;
}

export default function VideoPlayer({ videoSrc, posterSrc }: VideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [Player, setPlayer] = useState<typeof ReactPlayer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);
    import("react-player").then((module) => {
      setPlayer(() => module.default);
    });
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(!isPlaying);
    setHasInteracted(true);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
    setCurrentTime(formatTime(video.currentTime));
  };

  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!video.duration) return;
    setDuration(formatTime(video.duration));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = playerRef.current;
    if (!video?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      setIsMuted(true);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (!mounted || !Player) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-16 h-16 rounded-full bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-2xl ring-1 ring-white/10"
      onClick={() => handlePlayPause()}
    >
      <Player
        ref={playerRef}
        src={videoSrc}
        poster={posterSrc}
        playing={isPlaying}
        muted={isMuted}
        volume={volume}
        width="100%"
        height="100%"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        config={{
          youtube: {
            rel: 0,
            fs: 0,
            iv_load_policy: 3,
          },
        }}
        style={{ pointerEvents: "none" }}
      />

      {/* Big Play Button Overlay */}
      {!isPlaying && !hasInteracted && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 transition-opacity duration-300">
          <button
            onClick={handlePlayPause}
            aria-label="Play video"
            className="hidden md:w-20 md:h-20 md:flex items-center justify-center rounded-full bg-primary backdrop-blur-md border border-white/20 hover:scale-110 transition-transform"
          >
            <Play className="w-8 h-8 fill-white ml-1" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 z-30 flex flex-col gap-3 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/50 to-transparent ${
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="slider"
          aria-label="Seek video"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer relative group/bar"
          onClick={handleSeek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                className="hover:scale-110 transition-transform"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={22} />
                ) : (
                  <Volume2 size={22} />
                )}
              </button>

              <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-in-out flex items-center h-4">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Volume level"
                  className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <span className="text-sm font-medium tracking-wide opacity-80">
              {currentTime} / {duration}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="hover:scale-110 transition-transform"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
