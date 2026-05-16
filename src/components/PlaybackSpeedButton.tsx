import { useEffect, useRef, useState } from "react";

const SPEEDS = [1.0, 1.25, 1.5, 2.0, 3.0];
const STORAGE_KEY = "playback-speed";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function PlaybackSpeedButton({ videoRef }: Props) {
  const [speed, setSpeed] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseFloat(stored) : 1.0;
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const select = (s: number) => {
    setSpeed(s);
    localStorage.setItem(STORAGE_KEY, String(s));
    setOpen(false);
  };

  const label = speed === 1.0 ? "1,0" : String(speed).replace(".", ",");

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed, videoRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="px-2 py-1 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer min-w-[40px] text-center"
        title="Playback speed"
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1 bg-zinc-900/90 dark:bg-zinc-800/95 backdrop-blur-sm rounded-xl px-2 py-2 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {SPEEDS.map((s) => {
            const lbl = s === 1.0 ? "1,0" : String(s).replace(".", ",");
            const active = s === speed;
            return (
              <button
                key={s}
                onClick={() => select(s)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-zinc-600 text-white"
                    : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
