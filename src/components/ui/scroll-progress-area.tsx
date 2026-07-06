import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScrollProgressAreaProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Resets scroll position and progress when this value changes (e.g. active tab). */
  scrollKey?: string;
}

export function ScrollProgressArea({
  children,
  className,
  contentClassName,
  scrollKey,
}: ScrollProgressAreaProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(0);

  const updateProgress = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    setProgress(maxScroll <= 0 ? 0 : (el.scrollTop / maxScroll) * 100);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    setProgress(0);
  }, [scrollKey]);

  React.useEffect(() => {
    updateProgress();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateProgress);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateProgress, children]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <Progress
        value={progress}
        className="h-0.5 shrink-0 rounded-none bg-muted"
        aria-label="Scroll progress"
      />
      <div
        ref={scrollRef}
        onScroll={updateProgress}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
