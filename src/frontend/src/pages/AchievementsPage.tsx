import { AchievementKey } from "@/backend";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAchievements } from "@/hooks/useQueries";
import { formatDate, formatXpLabel } from "@/lib/format";
import type { AchievementView } from "@/types";
import {
  Award,
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  Crown,
  Flame,
  Lock,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** The six badges, in the order the product presents them. */
const BADGE_ORDER: AchievementKey[] = [
  AchievementKey.firstStudySession,
  AchievementKey.fiveHourLearner,
  AchievementKey.sevenDayStreak,
  AchievementKey.thirtyDayStreak,
  AchievementKey.questMaster,
  AchievementKey.xpChampion,
];

const BADGE_ICONS: Record<string, LucideIcon> = {
  firstStudySession: BookOpenCheck,
  fiveHourLearner: CalendarClock,
  sevenDayStreak: Flame,
  thirtyDayStreak: CalendarCheck,
  questMaster: Target,
  xpChampion: Crown,
};

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, index) => `achievement-skeleton-${index}`,
);

function sortAchievements(views: AchievementView[]): AchievementView[] {
  return [...views].sort((a, b) => {
    const ai = BADGE_ORDER.indexOf(a.achievement.key);
    const bi = BADGE_ORDER.indexOf(b.achievement.key);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function AchievementCard({
  view,
  index,
}: {
  view: AchievementView;
  index: number;
}) {
  const { achievement, earned, earnedAt } = view;
  const Icon = BADGE_ICONS[achievement.key] ?? Award;

  return (
    <Card
      data-ocid={`achievement.card.${index + 1}`}
      className={
        earned
          ? "glass glow-ring relative overflow-hidden rounded-2xl border-border transition-smooth hover:-translate-y-1"
          : "glass relative overflow-hidden rounded-2xl border-border opacity-80 transition-smooth hover:-translate-y-1 hover:opacity-100"
      }
    >
      <span
        aria-hidden="true"
        className={
          earned
            ? "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-primary opacity-25 blur-2xl"
            : "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-muted opacity-40 blur-2xl"
        }
      />
      <CardContent className="relative flex flex-col gap-4 py-2">
        <div className="flex items-start justify-between gap-3">
          <span
            className={
              earned
                ? "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass"
                : "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
            }
          >
            <Icon className="size-6" />
          </span>
          {earned ? (
            <Badge
              data-ocid={`achievement.status.${index + 1}`}
              className="gap-1 border-transparent bg-success/15 text-success"
            >
              <Sparkles className="size-3" />
              Unlocked
            </Badge>
          ) : (
            <Badge
              data-ocid={`achievement.status.${index + 1}`}
              variant="outline"
              className="gap-1 text-muted-foreground"
            >
              <Lock className="size-3" />
              Locked
            </Badge>
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <h3 className="font-display text-base font-semibold text-foreground">
            {achievement.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {achievement.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Trophy className="size-4" />
            {formatXpLabel(achievement.xpReward)}
          </span>
          <span className="text-xs text-muted-foreground">
            {earned ? `Earned ${formatDate(earnedAt)}` : "Not earned yet"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementsSkeleton() {
  return (
    <div
      data-ocid="achievements.loading_state"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {SKELETON_IDS.map((id) => (
        <Card key={id} className="glass rounded-2xl border-border">
          <CardContent className="flex flex-col gap-4 py-2">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="size-12 rounded-2xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useAchievements();

  const achievements = sortAchievements(data ?? []);
  const earnedCount = achievements.filter((view) => view.earned).length;
  const total = achievements.length;
  const earnedPercent = total > 0 ? Math.round((earnedCount / total) * 100) : 0;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Milestones"
        title="Achievements"
        description="Track the badges you have earned and the ones still within reach."
      />

      {isLoading ? (
        <AchievementsSkeleton />
      ) : isError ? (
        <Card
          data-ocid="achievements.error_state"
          className="glass rounded-2xl border-destructive/40"
        >
          <CardContent className="flex flex-col items-start gap-4 py-2">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <Award className="size-6" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                We couldn't load your achievements
              </h2>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching your badges. Check your
                connection and try again.
              </p>
            </div>
            <Button
              type="button"
              data-ocid="achievements.retry_button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="gap-2 rounded-full"
            >
              <RefreshCw
                className={isFetching ? "size-4 animate-spin" : "size-4"}
              />
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card
            data-ocid="achievements.summary_card"
            className="glass glow-ring rounded-2xl border-border"
          >
            <CardContent className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
                  <Trophy className="size-7" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Badges earned
                  </p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {earnedCount}
                    <span className="text-muted-foreground"> / {total}</span>
                  </p>
                </div>
              </div>
              <div className="w-full space-y-2 sm:max-w-xs">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Collection progress</span>
                  <span className="font-semibold text-foreground">
                    {earnedPercent}%
                  </span>
                </div>
                <Progress
                  value={earnedPercent}
                  aria-label="Achievement collection progress"
                />
              </div>
            </CardContent>
          </Card>

          {total === 0 ? (
            <Card
              data-ocid="achievements.empty_state"
              className="glass rounded-2xl border-border"
            >
              <CardContent className="flex flex-col items-start gap-4 py-2">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
                  <Award className="size-6" />
                </span>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    No achievements available yet
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Badges will appear here as soon as they are configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((view, index) => (
                <AchievementCard
                  key={view.achievement.key}
                  view={view}
                  index={index}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
