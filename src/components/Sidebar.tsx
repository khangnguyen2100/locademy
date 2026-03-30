import { ChevronDown, ChevronRight, Check, Play, Circle, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import type { Module, Video } from "../lib/types";
import { ProgressBar } from "./ProgressBar";

interface Props {
  modules: Module[];
  activeVideoId: string | null;
  onSelectVideo: (video: Video) => void;
  onToggleComplete: (videoId: string) => void;
}

export function Sidebar({
  modules,
  activeVideoId,
  onSelectVideo,
  onToggleComplete,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(modules.map((m) => m.id))
  );

  useEffect(() => {
    if (!activeVideoId) return;
    const activeModule = modules.find((m) =>
      m.videos.some((v) => v.id === activeVideoId)
    );
    if (activeModule) {
      setCollapsed((prev) => {
        if (!prev.has(activeModule.id)) return prev;
        const next = new Set(prev);
        next.delete(activeModule.id);
        return next;
      });
    }
  }, [activeVideoId, modules]);

  const toggle = (moduleId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-end gap-1 px-3 pt-2 pb-1">
        <button
          onClick={() => setCollapsed(new Set())}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          title="Expand all"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          Expand all
        </button>
        <button
          onClick={() => setCollapsed(new Set(modules.map((m) => m.id)))}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          title="Collapse all"
        >
          <ChevronsDownUp className="w-3.5 h-3.5" />
          Collapse all
        </button>
      </div>
      <div className="p-3 pt-1 space-y-1">
        {modules.map((module) => {
          const completed = module.videos.filter((v) => v.completed).length;
          const total = module.videos.length;
          const isCollapsed = collapsed.has(module.id);
          const progress = total > 0 ? (completed / total) * 100 : 0;

          return (
            <div key={module.id}>
              <button
                onClick={() => toggle(module.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {module.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <ProgressBar value={progress} size="sm" />
                    </div>
                    <span className="text-xs text-zinc-400 whitespace-nowrap">
                      {completed}/{total}
                    </span>
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {module.videos.map((video) => {
                    const isActive = video.id === activeVideoId;
                    return (
                      <div
                        key={video.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-500/10"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <button
                          onClick={() => onToggleComplete(video.id)}
                          className="shrink-0 cursor-pointer"
                        >
                          {video.completed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                          )}
                        </button>
                        <button
                          onClick={() => onSelectVideo(video)}
                          className="flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <span
                            className={`text-sm block truncate ${
                              video.completed
                                ? "text-zinc-400 dark:text-zinc-500 line-through"
                                : isActive
                                  ? "text-indigo-600 dark:text-indigo-400 font-medium"
                                  : "text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {video.title}
                          </span>
                        </button>
                        {isActive && (
                          <Play className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
