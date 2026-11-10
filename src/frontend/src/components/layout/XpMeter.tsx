import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useQueries";
import { formatLevel, formatXp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Flame, Sparkles } from "lucide-react";

/**
 * The game-HUD stat cluster: level badge, gradient XP bar and streak flame.
 * Renders layout-matched skeletons while the dashboard query loads.
 */
export function XpMeter({ className }: { className?: string }) {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        data-ocid="xp.error_state"
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          className,
        )}
      >
        <Sparkles className="size-4" />
        <span>Progress unavailable</span>
      </div>
    );
  }

  const percent = Number(data.levelProgressPercent);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        data-ocid="xp.level_badge"
        className="animate-pulse-glow inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground shadow-glass"
      >
        {formatLevel(data.profile.level)}
      </span>
      <div className="hidden min-w-0 flex-col gap-1 sm:flex">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-mono font-semibold text-foreground">
            {formatXp(data.profile.xp)} XP
          </span>
          <span className="font-mono text-muted-foreground">
            {formatXp(data.xpToNextLevel)} to next
          </span>
        </div>
        <Progress
          value={percent}
          data-ocid="xp.progress"
          aria-label={`Level progress ${percent}%`}
          className="h-2 w-32 bg-muted"
        />
      </div>
      <span
        data-ocid="xp.streak"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-foreground"
        title={`${Number(data.goal.currentStreakDays)} day streak`}
      >
        <Flame className="size-3.5 text-warning" />
        {Number(data.goal.currentStreakDays)}
      </span>
    </div>
  );
}
