import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  AlertCircle,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubtitle } from "../hooks/useSubtitle";
import type { Video } from "../lib/types";
import { PlaybackSpeedButton } from "./PlaybackSpeedButton";
import { SubtitleToggle } from "./SubtitleToggle";

interface Props {
  video: Video;
  onEnded: () => void;
  onNext: (() => void) | null;
  onPrev: (() => void) | null;
}

const SPEED_STORAGE_KEY = "playback-speed";

export function VideoPlayer({ video, onEnded, onNext, onPrev }: Props) {
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = convertFileSrc(video.path, "stream");

  const { hasSubtitle, subtitleUrl, subtitleEnabled, toggle } = useSubtitle(
    video.path
  );

  const toggleFullscreen = useCallback(async () => {
    const win = getCurrentWindow();
    const current = await win.isFullscreen();
    await win.setFullscreen(!current);
    setIsFullscreen(!current);
  }, []);

  useEffect(() => {
    const win = getCurrentWindow();
    const checkFullscreen = async () => {
      setIsFullscreen(await win.isFullscreen());
    };
    checkFullscreen();

    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let held = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        win.setFullscreen(false);
        setIsFullscreen(false);
      }

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        holdTimer = setTimeout(() => {
          held = true;
          if (videoRef.current) videoRef.current.playbackRate = 2.0;
        }, 300);
      }

      if (e.code === "Space" && e.repeat) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();

      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      const video = videoRef.current;
      if (!video) return;

      if (held) {
        const stored = localStorage.getItem(SPEED_STORAGE_KEY);
        video.playbackRate = stored ? parseFloat(stored) : 1.0;
        held = false;
      } else {
        video.paused ? video.play() : video.pause();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [isFullscreen]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center min-h-0">
        {error ? (
          <div className="text-center text-white/70 p-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-white/40" />
            <p>This format isn't supported in the built-in player.</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            className="w-full h-full object-contain"
            onEnded={onEnded}
            onError={() => setError(true)}
            onLoadedMetadata={() => {
              const stored = localStorage.getItem(SPEED_STORAGE_KEY);
              if (stored && videoRef.current) {
                videoRef.current.playbackRate = parseFloat(stored);
              }
            }}
          >
            {subtitleUrl && (
              <track
                key={subtitleUrl}
                kind="subtitles"
                src={subtitleUrl}
                label="Subtitles"
                srcLang="und"
                default
              />
            )}
          </video>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0">
          {video.title}
        </h2>
        <div className="flex items-center gap-1 ml-4">
          <PlaybackSpeedButton videoRef={videoRef} />
          {hasSubtitle && (
            <SubtitleToggle enabled={subtitleEnabled} onToggle={toggle} />
          )}
          <button
            onClick={onPrev ?? undefined}
            disabled={!onPrev}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <button
            onClick={onNext ?? undefined}
            disabled={!onNext}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            ) : (
              <Maximize className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
