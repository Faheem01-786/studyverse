import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAchievements,
  useDailyQuests,
  useDashboard,
  useSearchResources,
  useWeekDailyTotals,
} from "@/hooks/useQueries";
import {
  formatDayKey,
  formatLevel,
  formatMinutes,
  formatXp,
  progressPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AchievementView, QuestView, ResourceView } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Flame,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Week key — mirrors the backend's Monday-based YYYY-Www scheme.      */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

function pad(value: number, length: number): string {
  return value.toString().padStart(length, "0");
}

/** The UTC week key (YYYY-Www) for a date, matching the backend exactly. */
function weekKeyOf(date: Date): string {
  const days = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      DAY_MS,
  );
  const shifted = days + 3;
  const monday = shifted - (((shifted % 7) + 7) % 7) - 3;
  const week = Math.floor((monday + 3) / 7);
  const year = 1970 + Math.floor(week / 52);
  const weekOfYear = week - (year - 1970) * 52;
  return `${pad(year, 4)}-W${pad(weekOfYear + 1, 2)}`;
}

/* ------------------------------------------------------------------ */
/* Shared presentational pieces                                        */
/* ------------------------------------------------------------------ */

const glassCard =
  "glass rounded-2xl border-border/60 shadow-glass transition-smooth hover:border-primary/40";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  ocid,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent: string;
  ocid: string;
}) {
  return (
    <Card data-ocid={ocid} className={glassCard}>
      <CardContent className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-glass",
            accent,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="truncate font-display text-xl font-bold text-foreground">
            {value}
          </p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  ocid,
}: {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  ocid: string;
}) {
  return (
    <Card data-ocid={ocid} className={glassCard}>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  ocid,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-8 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="font-display text-sm font-semibold text-foreground">
        {title}
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  ocid,
}: {
  message: string;
  onRetry: () => void;
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-8 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <p className="font-display text-sm font-semibold text-foreground">
        Could not load this section
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-ocid={`${ocid}.retry_button`}
        onClick={onRetry}
      >
        <RefreshCw className="size-4" />
        Retry
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  const ids = Array.from({ length: 4 }, (_, i) => `dash-skeleton-${i}`);
  return (
    <div data-ocid="dashboard.loading_state" className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ids.map((id) => (
          <Skeleton key={id} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Weekly chart                                                        */
/* ------------------------------------------------------------------ */

function WeeklyChart({
  totals,
  goalMinutes,
}: {
  totals: Array<{ dayKey: string; minutes: bigint }>;
  goalMinutes: bigint;
}) {
  const max = totals.reduce(
    (acc, entry) => Math.max(acc, Number(entry.minutes)),
    0,
  );
  const scale = Math.max(max, Number(goalMinutes), 1);

  return (
    <div
      data-ocid="dashboard.weekly_chart"
      className="flex h-52 items-end justify-between gap-2 sm:gap-3"
    >
      {totals.map((entry) => {
        const minutes = Number(entry.minutes);
        const height = Math.max(4, Math.round((minutes / scale) * 100));
        const metGoal = minutes >= Number(goalMinutes) && minutes > 0;
        return (
          <div
            key={entry.dayKey}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="font-mono text-[10px] text-muted-foreground">
              {minutes > 0 ? formatMinutes(minutes) : ""}
            </span>
            <div className="flex h-full w-full items-end">
              <div
                data-ocid={`dashboard.weekly_chart.bar.${entry.dayKey}`}
                className={cn(
                  "w-full rounded-t-lg transition-smooth",
                  metGoal
                    ? "bg-gradient-primary shadow-glass"
                    : "bg-primary/30",
                )}
                style={{ height: `${height}%` }}
                title={`${formatDayKey(entry.dayKey)}: ${formatMinutes(minutes)}`}
              />
            </div>
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {formatDayKey(entry.dayKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quests                                                              */
/* ------------------------------------------------------------------ */

function QuestRow({ view }: { view: QuestView }) {
  const percent = progressPercent(view.progress, view.target);
  return (
    <li
      data-ocid={`dashboard.quest.item.${view.quest.id.toString()}`}
      className="rounded-xl border border-border/60 bg-muted/20 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {view.quest.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {view.quest.description}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 gap-1 font-mono text-[11px]"
        >
          <Zap className="size-3 text-primary" />
          {formatXp(view.quest.xpReward)}
        </Badge>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <Progress
          value={percent}
          className="h-2 flex-1 bg-muted"
          aria-label={`${view.quest.title} progress ${percent}%`}
        />
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {formatXp(view.progress)}/{formatXp(view.target)}
        </span>
      </div>
      {view.completed && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-success">
          <Trophy className="size-3" />
          {view.claimed ? "Reward claimed" : "Completed — claim on Quests"}
        </p>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

function AchievementRow({ view }: { view: AchievementView }) {
  return (
    <li
      data-ocid={`dashboard.achievement.item.${view.achievement.key}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        view.earned
          ? "border-primary/40 bg-primary/5"
          : "border-border/60 bg-muted/20 opacity-70",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          view.earned
            ? "bg-gradient-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Medal className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {view.achievement.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {view.achievement.description}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {view.earned ? "Earned" : `+${formatXp(view.achievement.xpReward)} XP`}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Quick access                                                        */
/* ------------------------------------------------------------------ */

const QUICK_LINKS: Array<{
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    to: "/study-room",
    label: "Study Room",
    description: "Start a timed focus session",
    icon: Timer,
  },
  {
    to: "/library",
    label: "Study Library",
    description: "Browse notes and PDFs",
    icon: BookOpen,
  },
  {
    to: "/quests",
    label: "Daily Quests",
    description: "Claim XP rewards",
    icon: Target,
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    description: "See where you rank",
    icon: Trophy,
  },
];

function QuickAccess({ resources }: { resources: ResourceView[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          data-ocid={`dashboard.quick.link.${link.label
            .toLowerCase()
            .replace(/\s+/g, "_")}`}
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-smooth hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
            <link.icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {link.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {link.description}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-smooth group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      ))}
      {resources.length > 0 && (
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recently added materials
          </p>
          <ul className="space-y-2">
            {resources.slice(0, 3).map((resource) => (
              <li key={resource.id.toString()}>
                <Link
                  to="/library"
                  data-ocid={`dashboard.resource.link.${resource.id.toString()}`}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-smooth hover:border-primary/40 hover:bg-primary/5"
                >
                  <BookOpen className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {resource.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {resource.subject} · {resource.category}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const dashboard = useDashboard();
  const weekKey = weekKeyOf(new Date());
  const weekTotals = useWeekDailyTotals(weekKey);
  const quests = useDailyQuests();
  const achievements = useAchievements();
  const resources = useSearchResources({});

  if (dashboard.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Your progress"
          title="Dashboard"
          description="Your XP, level, daily goal, streak and weekly statistics at a glance."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Your progress"
          title="Dashboard"
          description="Your XP, level, daily goal, streak and weekly statistics at a glance."
        />
        <ErrorState
          ocid="dashboard.error_state"
          message={
            dashboard.error instanceof Error
              ? dashboard.error.message
              : "We could not reach the backend. Check your connection and try again."
          }
          onRetry={() => void dashboard.refetch()}
        />
      </div>
    );
  }

  const data = dashboard.data;
  const { profile, goal } = data;
  const levelPercent = Number(data.levelProgressPercent);
  const goalPercent = progressPercent(
    data.studyMinutesToday,
    goal.dailyGoalMinutes,
  );
  const goalMet =
    Number(goal.dailyGoalMinutes) > 0 &&
    Number(data.studyMinutesToday) >= Number(goal.dailyGoalMinutes);

  const questList = quests.data ?? [];
  const achievementList = achievements.data ?? [];
  const earnedAchievements = achievementList.filter((a) => a.earned);
  const recentAchievements = [...earnedAchievements]
    .sort((a, b) => Number((b.earnedAt ?? 0n) - (a.earnedAt ?? 0n)))
    .slice(0, 4);
  const resourceList = resources.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your progress"
        title={`Welcome back, ${profile.displayName}`}
        description="Here is your study momentum today — keep the streak alive."
        actions={
          <Button asChild data-ocid="dashboard.study_button">
            <Link to="/study-room">
              <Timer className="size-4" />
              Start studying
            </Link>
          </Button>
        }
      />

      {/* Hero: level + XP progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card
          data-ocid="dashboard.hero.card"
          className="glass relative overflow-hidden rounded-2xl border-border/60 shadow-glass"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
          <CardContent className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary font-display text-2xl font-bold text-primary-foreground shadow-glass">
                {Number(profile.level)}
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Current level
                </p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {formatLevel(profile.level)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatXp(profile.xp)} XP total
                </p>
              </div>
            </div>

            <div className="w-full md:max-w-sm">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Progress to next level
                </span>
                <span className="font-mono text-muted-foreground">
                  {formatXp(data.xpToNextLevel)} XP to go
                </span>
              </div>
              <Progress
                value={levelPercent}
                data-ocid="dashboard.xp_progress"
                aria-label={`Level progress ${levelPercent}%`}
                className="h-3 bg-muted"
              />
              <p className="mt-1.5 text-right font-mono text-xs text-muted-foreground">
                {levelPercent}%
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          ocid="dashboard.stat.xp_today"
          icon={Zap}
          label="XP today"
          value={formatXp(data.xpToday)}
          hint={`${formatXp(data.xpThisWeek)} XP this week`}
          accent="bg-gradient-primary"
        />
        <StatCard
          ocid="dashboard.stat.study_today"
          icon={Timer}
          label="Studied today"
          value={formatMinutes(data.studyMinutesToday)}
          hint={`Goal ${formatMinutes(goal.dailyGoalMinutes)}`}
          accent="bg-gradient-to-br from-accent to-primary"
        />
        <StatCard
          ocid="dashboard.stat.streak"
          icon={Flame}
          label="Current streak"
          value={`${Number(goal.currentStreakDays)} days`}
          hint={`Longest ${Number(goal.longestStreakDays)} days`}
          accent="bg-gradient-to-br from-warning to-destructive"
        />
        <StatCard
          ocid="dashboard.stat.week"
          icon={TrendingUp}
          label="This week"
          value={formatMinutes(data.studyMinutesThisWeek)}
          hint={`${formatXp(data.xpThisWeek)} XP earned`}
          accent="bg-gradient-to-br from-chart-3 to-accent"
        />
      </div>

      {/* Daily goal + weekly chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          ocid="dashboard.goal.card"
          title="Daily study goal"
          icon={Target}
          action={
            <Badge
              variant={goalMet ? "default" : "secondary"}
              className="gap-1 font-mono text-[11px]"
            >
              {goalMet ? "Goal met" : `${goalPercent}%`}
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-3xl font-bold text-foreground">
                  {formatMinutes(data.studyMinutesToday)}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {formatMinutes(goal.dailyGoalMinutes)} goal
                </p>
              </div>
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  goalMet
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Target className="size-5" />
              </span>
            </div>
            <Progress
              value={goalPercent}
              data-ocid="dashboard.goal_progress"
              aria-label={`Daily goal ${goalPercent}%`}
              className="h-3 bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {goalMet
                ? "Great work — you hit today's target."
                : `${formatMinutes(
                    Math.max(
                      0,
                      Number(goal.dailyGoalMinutes) -
                        Number(data.studyMinutesToday),
                    ),
                  )} left to reach today's goal.`}
            </p>
          </div>
        </SectionCard>

        <SectionCard
          ocid="dashboard.weekly.card"
          title="Weekly study statistics"
          icon={CalendarDays}
          action={
            <span className="font-mono text-[11px] text-muted-foreground">
              {weekKey}
            </span>
          }
        >
          {weekTotals.isLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : weekTotals.isError ? (
            <ErrorState
              ocid="dashboard.weekly.error_state"
              message="Weekly totals could not be loaded."
              onRetry={() => void weekTotals.refetch()}
            />
          ) : (weekTotals.data ?? []).length === 0 ? (
            <EmptyState
              ocid="dashboard.weekly.empty_state"
              icon={CalendarDays}
              title="No study time this week"
              description="Finish a study session to see your weekly chart fill up."
            />
          ) : (
            <WeeklyChart
              totals={weekTotals.data ?? []}
              goalMinutes={goal.dailyGoalMinutes}
            />
          )}
        </SectionCard>
      </div>

      {/* Quests + achievements */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          ocid="dashboard.quests.card"
          title="Today's quests"
          icon={Target}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/quests" data-ocid="dashboard.quests.link">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        >
          {quests.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => `quest-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-20 w-full rounded-xl" />
                ),
              )}
            </div>
          ) : quests.isError ? (
            <ErrorState
              ocid="dashboard.quests.error_state"
              message="Daily quests could not be loaded."
              onRetry={() => void quests.refetch()}
            />
          ) : questList.length === 0 ? (
            <EmptyState
              ocid="dashboard.quests.empty_state"
              icon={Target}
              title="No quests today"
              description="New daily quests appear here as soon as they are available."
            />
          ) : (
            <ul className="space-y-3">
              {questList.slice(0, 4).map((view) => (
                <QuestRow key={view.quest.id.toString()} view={view} />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          ocid="dashboard.achievements.card"
          title="Recent achievements"
          icon={Medal}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/achievements" data-ocid="dashboard.achievements.link">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        >
          {achievements.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => `ach-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-16 w-full rounded-xl" />
                ),
              )}
            </div>
          ) : achievements.isError ? (
            <ErrorState
              ocid="dashboard.achievements.error_state"
              message="Achievements could not be loaded."
              onRetry={() => void achievements.refetch()}
            />
          ) : recentAchievements.length === 0 ? (
            <EmptyState
              ocid="dashboard.achievements.empty_state"
              icon={Sparkles}
              title="No achievements yet"
              description="Study, keep streaks and complete quests to unlock your first badge."
            />
          ) : (
            <ul className="space-y-3">
              {recentAchievements.map((view) => (
                <AchievementRow key={view.achievement.key} view={view} />
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Quick access */}
      <SectionCard
        ocid="dashboard.quick.card"
        title="Quick access"
        icon={Sparkles}
      >
        <QuickAccess resources={resourceList} />
      </SectionCard>
    </div>
  );
}
