import { Captions, CaptionsOff } from "lucide-react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function SubtitleToggle({ enabled, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={enabled ? "Disable subtitles" : "Enable subtitles"}
      aria-pressed={enabled}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${
        enabled
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
      }`}
      title={enabled ? "Disable subtitles" : "Enable subtitles"}
    >
      {enabled ? (
        <Captions className="w-5 h-5" />
      ) : (
        <CaptionsOff className="w-5 h-5" />
      )}
    </button>
  );
}
