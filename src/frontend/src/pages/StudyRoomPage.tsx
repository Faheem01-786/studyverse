import { SessionStatus as SessionStatusEnum } from "@/backend";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDailyReport,
  useFinishStudySession,
  useGoal,
  usePauseStudySession,
  useResumeStudySession,
  useSetDailyGoal,
  useStartStudySession,
  useStudySessions,
  useWeekDailyTotals,
  useWeeklyReport,
} from "@/hooks/useQueries";
import {
  formatDate,
  formatDayKey,
  formatDuration,
  formatMinutes,
  formatXp,
  formatXpLabel,
  progressPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SessionStatus, StudySessionView } from "@/types";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Preset subjects a student can pick from, plus a custom option. */
const PRESET_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Science",
] as const;

const CUSTOM_SUBJECT = "__custom__";

/** UTC day key (YYYY-MM-DD), matching the backend's day-key format. */
function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** UTC week key (YYYY-Www) for the Monday-starting week, matching the backend. */
function utcWeekKey(date: Date): string {
  const days = Math.floor(date.getTime() / 86_400_000);
  const shifted = days + 3;
  const monday = shifted - (((shifted % 7) + 7) % 7) - 3;
  const week = Math.floor((monday + 3) / 7);
  const year = 1970 + Math.floor(week / 52);
  const weekOfYear = week - (year - 1970) * 52;
  return `${year}-W${(weekOfYear + 1).toString().padStart(2, "0")}`;
}

/** The Monday day key for a given week key, used to label the weekly chart. */
function weekStartDayKey(weekKey: string): string {
  const [yearPart, weekPart] = weekKey.split("-");
  const year = Number.parseInt(yearPart, 10);
  const week = Number.parseInt(weekPart.replace("W", ""), 10);
  const jan4 = Date.UTC(year, 0, 4);
  const jan4Days = Math.floor(jan4 / 86_400_000);
  const jan4Shifted = jan4Days + 3;
  const mondayOfJan4Week = jan4Shifted - (jan4Shifted % 7) - 3;
  const monday = mondayOfJan4Week + (week - 1) * 7;
  return utcDayKey(new Date(monday * 86_400_000));
}

/** Add days to a YYYY-MM-DD day key. */
function addDays(dayKey: string, offset: number): string {
  const [y, m, d] = dayKey.split("-").map((part) => Number.parseInt(part, 10));
  const base = Date.UTC(y, m - 1, d);
  return utcDayKey(new Date(base + offset * 86_400_000));
}

/** Human label for a session status. */
function statusLabel(status: SessionStatus): string {
  switch (status) {
    case SessionStatusEnum.running:
      return "Running";
    case SessionStatusEnum.paused:
      return "Paused";
    default:
      return "Finished";
  }
}

/** The active (running or paused) session, if any. */
function findActiveSession(
  sessions: StudySessionView[] | undefined,
): StudySessionView | undefined {
  return sessions?.find(
    (session) => session.status !== SessionStatusEnum.finished,
  );
}

export default function StudyRoomPage() {
  const now = useMemo(() => new Date(), []);
  const dayKey = useMemo(() => utcDayKey(now), [now]);
  const weekKey = useMemo(() => utcWeekKey(now), [now]);

  const sessionsQuery = useStudySessions();
  const goalQuery = useGoal();
  const dailyReportQuery = useDailyReport(dayKey);
  const weeklyReportQuery = useWeeklyReport(weekKey);
  const weekTotalsQuery = useWeekDailyTotals(weekKey);

  const startSession = useStartStudySession();
  const pauseSession = usePauseStudySession();
  const resumeSession = useResumeStudySession();
  const finishSession = useFinishStudySession();
  const setDailyGoal = useSetDailyGoal();

  const sessions = sessionsQuery.data ?? [];
  const activeSession = findActiveSession(sessions);
  const goal = goalQuery.data;

  /* ---------------- Subject selection ---------------- */
  const [subjectChoice, setSubjectChoice] = useState<string>(
    PRESET_SUBJECTS[0],
  );
  const [customSubject, setCustomSubject] = useState("");
  const resolvedSubject =
    subjectChoice === CUSTOM_SUBJECT ? customSubject.trim() : subjectChoice;

  /* ---------------- Live timer (display only) ---------------- */
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeSession || activeSession.status !== SessionStatusEnum.running) {
      setElapsedSeconds(
        activeSession ? Number(activeSession.accumulatedSeconds) : 0,
      );
      return;
    }
    const base = Number(activeSession.accumulatedSeconds);
    const resumedAt = Date.now();
    setElapsedSeconds(base);
    const interval = window.setInterval(() => {
      setElapsedSeconds(base + Math.floor((Date.now() - resumedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeSession]);

  /* ---------------- Daily goal form ---------------- */
  const [goalHours, setGoalHours] = useState("");
  const goalInitialized = useRef(false);
  useEffect(() => {
    if (goal && !goalInitialized.current) {
      goalInitialized.current = true;
      setGoalHours((Number(goal.dailyGoalMinutes) / 60).toString());
    }
  }, [goal]);

  /* ---------------- Last finished session (XP reveal) ---------------- */
  const [lastFinished, setLastFinished] = useState<StudySessionView | null>(
    null,
  );

  const isBusy =
    startSession.isPending ||
    pauseSession.isPending ||
    resumeSession.isPending ||
    finishSession.isPending;

  const handleStart = () => {
    if (!resolvedSubject) {
      toast.error("Pick or type a subject before starting.");
      return;
    }
    startSession.mutate(resolvedSubject, {
      onSuccess: () => {
        setLastFinished(null);
        toast.success(`Session started · ${resolvedSubject}`);
      },
      onError: () => toast.error("Could not start the session. Try again."),
    });
  };

  const handlePause = () => {
    if (!activeSession) return;
    pauseSession.mutate(activeSession.id, {
      onSuccess: () => toast.success("Session paused."),
      onError: () => toast.error("Could not pause the session."),
    });
  };

  const handleResume = () => {
    if (!activeSession) return;
    resumeSession.mutate(activeSession.id, {
      onSuccess: () => toast.success("Session resumed."),
      onError: () => toast.error("Could not resume the session."),
    });
  };

  const handleFinish = () => {
    if (!activeSession) return;
    finishSession.mutate(activeSession.id, {
      onSuccess: (finished) => {
        setLastFinished(finished);
        const xp = finished.rewardedXp ?? 0n;
        toast.success(
          xp > 0n
            ? `Session finished · +${formatXpLabel(xp)} earned`
            : "Session finished · no XP for under a minute",
        );
      },
      onError: () => toast.error("Could not finish the session."),
    });
  };

  const handleSaveGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hours = Number.parseFloat(goalHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error("Enter a daily goal greater than zero.");
      return;
    }
    const minutes = BigInt(Math.round(hours * 60));
    setDailyGoal.mutate(minutes, {
      onSuccess: () => toast.success(`Daily goal set to ${hours}h.`),
      onError: () => toast.error("Could not save the daily goal."),
    });
  };

  /* ---------------- Derived report values ---------------- */
  const goalMinutes = goal ? Number(goal.dailyGoalMinutes) : 0;
  const todayMinutes = dailyReportQuery.data
    ? Number(dailyReportQuery.data.totalMinutes)
    : 0;
  const todayXp = dailyReportQuery.data?.totalXp ?? 0n;
  const todayPercent = progressPercent(todayMinutes, goalMinutes);

  const weekTotals = weekTotalsQuery.data ?? [];
  const weekStart = weekStartDayKey(weekKey);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(weekStart, index);
    const total = weekTotals.find((entry) => entry.dayKey === key);
    return {
      key,
      minutes: total ? Number(total.minutes) : 0,
      xp: total?.xp ?? 0n,
    };
  });
  const weekMaxMinutes = Math.max(1, ...weekDays.map((day) => day.minutes));

  const weeklyReport = weeklyReportQuery.data;
  const bySubject = weeklyReport?.bySubject ?? [];

  const streakDays = goal ? Number(goal.currentStreakDays) : 0;
  const longestStreak = goal ? Number(goal.longestStreakDays) : 0;

  const finishedSessions = sessions.filter(
    (session) => session.status === SessionStatusEnum.finished,
  );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Focus mode"
        title="Study Room"
        description="Run a timed study session, pick a subject and earn XP for the focus time the server verifies."
      />

      {/* Server-measured XP notice */}
      <div
        data-ocid="study.xp_notice"
        className="glass flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
      >
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          XP is awarded for the time the server measures while your session is
          running — pausing stops the clock, and only verified minutes count.
          Anchors: 30 minutes = 20 XP, 60 minutes = 50 XP.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* ---------------- Timer ---------------- */}
        <Card
          data-ocid="study.timer_card"
          className="glass rounded-2xl border-border shadow-glass"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Clock className="size-5 text-primary" />
              Session timer
            </CardTitle>
            <CardDescription>
              {activeSession
                ? `Studying ${activeSession.subject}`
                : "Choose a subject and start a focused session."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div
                data-ocid="study.timer_display"
                className="font-mono text-5xl font-bold tracking-tight text-gradient tabular-nums sm:text-6xl"
              >
                {formatDuration(elapsedSeconds)}
              </div>
              {activeSession ? (
                <Badge
                  data-ocid="study.status_badge"
                  variant={
                    activeSession.status === SessionStatusEnum.running
                      ? "default"
                      : "secondary"
                  }
                  className="gap-1.5"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      activeSession.status === SessionStatusEnum.running
                        ? "animate-pulse-glow bg-primary-foreground"
                        : "bg-muted-foreground",
                    )}
                  />
                  {statusLabel(activeSession.status)}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5">
                  <span className="size-1.5 rounded-full bg-muted-foreground" />
                  Idle
                </Badge>
              )}
            </div>

            {/* Subject selection */}
            <div className="space-y-2">
              <Label htmlFor="study-subject">Subject</Label>
              <Select
                value={subjectChoice}
                onValueChange={setSubjectChoice}
                disabled={!!activeSession}
              >
                <SelectTrigger
                  id="study-subject"
                  data-ocid="study.subject_select"
                  className="w-full"
                >
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_SUBJECT}>
                    Custom subject…
                  </SelectItem>
                </SelectContent>
              </Select>
              {subjectChoice === CUSTOM_SUBJECT && (
                <Input
                  data-ocid="study.custom_subject_input"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  disabled={!!activeSession}
                  maxLength={60}
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              {!activeSession && (
                <Button
                  type="button"
                  data-ocid="study.start_button"
                  onClick={handleStart}
                  disabled={isBusy || !resolvedSubject}
                  className="rounded-full bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:opacity-90"
                >
                  <Play className="size-4" />
                  Start session
                </Button>
              )}
              {activeSession?.status === SessionStatusEnum.running && (
                <Button
                  type="button"
                  data-ocid="study.pause_button"
                  variant="secondary"
                  onClick={handlePause}
                  disabled={isBusy}
                  className="rounded-full transition-smooth"
                >
                  <Pause className="size-4" />
                  Pause
                </Button>
              )}
              {activeSession?.status === SessionStatusEnum.paused && (
                <Button
                  type="button"
                  data-ocid="study.resume_button"
                  variant="secondary"
                  onClick={handleResume}
                  disabled={isBusy}
                  className="rounded-full transition-smooth"
                >
                  <RotateCcw className="size-4" />
                  Resume
                </Button>
              )}
              {activeSession && (
                <Button
                  type="button"
                  data-ocid="study.finish_button"
                  variant="outline"
                  onClick={handleFinish}
                  disabled={isBusy}
                  className="rounded-full transition-smooth"
                >
                  <Square className="size-4" />
                  Finish
                </Button>
              )}
            </div>

            {/* XP reveal for the last finished session */}
            {lastFinished && (
              <div
                data-ocid="study.xp_result"
                className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
              >
                <Trophy className="size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {lastFinished.subject} ·{" "}
                    {formatMinutes(
                      Number(lastFinished.accumulatedSeconds) / 60,
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(lastFinished.rewardedXp ?? 0n) > 0n
                      ? `You earned ${formatXpLabel(lastFinished.rewardedXp ?? 0n)} for this verified session.`
                      : "No XP this time — sessions under a minute are not rewarded."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------- Goal + streak ---------------- */}
        <div className="space-y-6">
          <Card
            data-ocid="study.goal_card"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Target className="size-5 text-primary" />
                Daily goal
              </CardTitle>
              <CardDescription>
                {goal
                  ? `Current goal: ${formatMinutes(goalMinutes)} per day`
                  : "Set how long you want to study each day."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalQuery.isLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : goalQuery.isError ? (
                <p
                  data-ocid="study.goal_error_state"
                  className="flex items-center gap-2 text-sm text-destructive"
                >
                  <AlertCircle className="size-4" />
                  Could not load your goal.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Today · {formatMinutes(todayMinutes)} of{" "}
                        {formatMinutes(goalMinutes)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {todayPercent}%
                      </span>
                    </div>
                    <Progress
                      data-ocid="study.goal_progress"
                      value={todayPercent}
                      className="h-2.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatXpLabel(todayXp)} earned today
                    </p>
                  </div>

                  <form
                    onSubmit={handleSaveGoal}
                    className="flex items-end gap-2"
                  >
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="study-goal-hours">
                        Daily goal (hours)
                      </Label>
                      <Input
                        id="study-goal-hours"
                        data-ocid="study.goal_input"
                        type="number"
                        min="0.25"
                        step="0.25"
                        inputMode="decimal"
                        value={goalHours}
                        onChange={(event) => setGoalHours(event.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-ocid="study.goal_save_button"
                      disabled={setDailyGoal.isPending}
                      className="rounded-full transition-smooth"
                    >
                      Save
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            data-ocid="study.streak_card"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="flex items-center gap-4 py-2">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
                <Flame className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold text-foreground">
                  {streakDays} day{streakDays === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current streak · longest {longestStreak} day
                  {longestStreak === 1 ? "" : "s"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------------- Reports ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          data-ocid="study.daily_report_card"
          className="glass rounded-2xl border-border shadow-glass"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <CalendarDays className="size-5 text-primary" />
              Today&apos;s report
            </CardTitle>
            <CardDescription>{formatDayKey(dayKey)}</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyReportQuery.isLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : dailyReportQuery.isError ? (
              <p
                data-ocid="study.daily_report_error_state"
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="size-4" />
                Could not load today&apos;s report.
              </p>
            ) : (
              <ReportSummary
                minutes={todayMinutes}
                xp={todayXp}
                sessionCount={Number(dailyReportQuery.data?.sessionCount ?? 0n)}
                bySubject={dailyReportQuery.data?.bySubject ?? []}
                emptyLabel="No sessions logged today yet."
              />
            )}
          </CardContent>
        </Card>

        <Card
          data-ocid="study.weekly_report_card"
          className="glass rounded-2xl border-border shadow-glass"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <TrendingUp className="size-5 text-primary" />
              This week
            </CardTitle>
            <CardDescription>
              {weeklyReport
                ? `${formatMinutes(Number(weeklyReport.totalMinutes))} across ${Number(weeklyReport.sessionCount)} session${Number(weeklyReport.sessionCount) === 1 ? "" : "s"}`
                : "Your weekly study totals"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {weeklyReportQuery.isLoading || weekTotalsQuery.isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : weeklyReportQuery.isError ? (
              <p
                data-ocid="study.weekly_report_error_state"
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="size-4" />
                Could not load the weekly report.
              </p>
            ) : (
              <>
                <div
                  data-ocid="study.week_chart"
                  className="flex h-32 items-end gap-2"
                >
                  {weekDays.map((day) => {
                    const height = Math.round(
                      (day.minutes / weekMaxMinutes) * 100,
                    );
                    return (
                      <div
                        key={day.key}
                        className="flex min-w-0 flex-1 flex-col items-center gap-2"
                      >
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-gradient-primary transition-smooth"
                            style={{
                              height: `${Math.max(day.minutes > 0 ? 6 : 2, height)}%`,
                            }}
                            title={`${formatDayKey(day.key)} · ${formatMinutes(day.minutes)}`}
                          />
                        </div>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {formatDayKey(day.key)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <ReportSummary
                  minutes={Number(weeklyReport?.totalMinutes ?? 0n)}
                  xp={weeklyReport?.totalXp ?? 0n}
                  sessionCount={Number(weeklyReport?.sessionCount ?? 0n)}
                  bySubject={bySubject}
                  emptyLabel="No sessions logged this week yet."
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Session history ---------------- */}
      <Card
        data-ocid="study.history_card"
        className="glass rounded-2xl border-border shadow-glass"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <BookOpen className="size-5 text-primary" />
            Session history
          </CardTitle>
          <CardDescription>
            Every finished session with its subject, duration, date and XP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => `history-${index}`).map(
                (id) => (
                  <Skeleton key={id} className="h-14 w-full rounded-xl" />
                ),
              )}
            </div>
          ) : sessionsQuery.isError ? (
            <p
              data-ocid="study.history_error_state"
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="size-4" />
              Could not load your session history.
            </p>
          ) : finishedSessions.length === 0 ? (
            <div
              data-ocid="study.history_empty_state"
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-10 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Clock className="size-6" />
              </span>
              <p className="font-medium text-foreground">
                No finished sessions yet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Start your first session above — it will appear here with its
                verified duration and XP.
              </p>
            </div>
          ) : (
            <ul data-ocid="study.history_list" className="space-y-3">
              {finishedSessions.map((session, index) => (
                <li
                  key={session.id.toString()}
                  data-ocid={`study.history_item.${index + 1}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 px-4 py-3 transition-smooth hover:border-primary/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <BookOpen className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {session.subject || "Untitled session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session.finishedAt ?? session.startedAt)} ·{" "}
                        {formatMinutes(Number(session.accumulatedSeconds) / 60)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 font-mono tabular-nums"
                  >
                    <CheckCircle2 className="size-3.5 text-primary" />
                    {formatXpLabel(session.rewardedXp ?? 0n)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Compact minutes / XP / session-count summary with a subject breakdown. */
function ReportSummary({
  minutes,
  xp,
  sessionCount,
  bySubject,
  emptyLabel,
}: {
  minutes: number;
  xp: bigint;
  sessionCount: number;
  bySubject: Array<[string, bigint]>;
  emptyLabel: string;
}) {
  if (sessionCount === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Study time" value={formatMinutes(minutes)} />
        <Stat label="XP earned" value={formatXp(xp)} />
        <Stat label="Sessions" value={sessionCount.toString()} />
      </div>
      {bySubject.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            By subject
          </p>
          <ul className="space-y-1.5">
            {bySubject.map(([subject, subjectMinutes]) => (
              <li
                key={subject}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate text-foreground">{subject}</span>
                <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                  {formatMinutes(subjectMinutes)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** A single labelled statistic tile. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
