import { useState, useEffect } from "react";
import { findSubtitle, readSubtitleAsVtt } from "../lib/commands";

const PREF_KEY = "locademy-subtitle-enabled";

function readPref(): boolean {
  const stored = localStorage.getItem(PREF_KEY);
  return stored === null ? true : stored === "true";
}

export interface UseSubtitleResult {
  hasSubtitle: boolean;
  subtitleUrl: string | null;
  subtitleEnabled: boolean;
  toggle: () => void;
}

/**
 * Detects and loads a subtitle file for the given video path.
 * The enabled/disabled preference is persisted to localStorage and
 * shared across all videos — the user only needs to set it once.
 */
export function useSubtitle(videoPath: string): UseSubtitleResult {
  const [subtitleEnabled, setSubtitleEnabled] = useState(readPref);
  const [subtitlePath, setSubtitlePath] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);

  // Effect 1: discover subtitle file — only reruns when the video changes.
  // This keeps hasSubtitle/toggle stable while the user enables/disables.
  useEffect(() => {
    let cancelled = false;
    setSubtitlePath(null);

    findSubtitle(videoPath)
      .then((path) => {
        if (!cancelled) setSubtitlePath(path ?? null);
      })
      .catch((err) => console.error("Failed to find subtitle:", err));

    return () => {
      cancelled = true;
    };
  }, [videoPath]);

  // Effect 2: load (or revoke) the VTT blob whenever the path or toggle changes.
  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setSubtitleUrl(null);
      if (!subtitlePath || !subtitleEnabled) return;

      try {
        const vttContent = await readSubtitleAsVtt(subtitlePath);
        if (cancelled) return;

        blobUrl = URL.createObjectURL(
          new Blob([vttContent], { type: "text/vtt" })
        );
        setSubtitleUrl(blobUrl);
      } catch (err) {
        console.error("Failed to load subtitle:", err);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [subtitlePath, subtitleEnabled]);

  const toggle = () => {
    setSubtitleEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(PREF_KEY, String(next));
      return next;
    });
  };

  return { hasSubtitle: subtitlePath !== null, subtitleUrl, subtitleEnabled, toggle };
}
