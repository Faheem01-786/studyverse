import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useClaimQuestReward, useDailyQuests } from "@/hooks/useQueries";
import { formatXp, progressPercent } from "@/lib/format";
import type { QuestGoal, QuestView } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Gift,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useState } from "react";

/** Human-readable description of what a quest goal requires. */
function goalLabel(goal: QuestGoal): string {
  switch (goal.__kind__) {
    case "solveQuestions":
      return `Solve ${goal.solveQuestions.toString()} questions`;
    case "studyMinutes":
      return `Study for ${goal.studyMinutes.toString()} minutes`;
    case "finishSession":
      return "Finish a study session";
    case "completeChapter":
      return "Complete a chapter";
    case "reachDailyGoal":
      return "Reach your daily goal";
    default:
      return "Complete the objective";
  }
}

function QuestCard({
  view,
  index,
  onClaim,
  isClaiming,
  justClaimed,
}: {
  view: QuestView;
  index: number;
  onClaim: (questId: QuestView["quest"]["id"]) => void;
  isClaiming: boolean;
  justClaimed: boolean;
}) {
  const { quest, progress, target, completed, claimed } = view;
  const percent = progressPercent(progress, target);
  const canClaim = completed && !claimed;

  return (
    <Card
      data-ocid={`quests.item.${index + 1}`}
      className="glass animate-fade-up rounded-2xl border-border shadow-glass transition-smooth hover:-translate-y-0.5 hover:border-primary/40"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className="flex flex-col gap-4 py-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={
                completed
                  ? "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success"
                  : "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass"
              }
            >
              {completed ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <Target className="size-5" />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <h3 className="font-display text-base font-semibold leading-tight text-foreground">
                {quest.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {quest.description}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 gap-1 rounded-full border-primary/30 bg-primary/10 font-mono text-primary"
          >
            <Sparkles className="size-3" />
            {formatXp(quest.xpReward)} XP
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              {goalLabel(quest.goal)}
            </span>
            <span className="font-mono text-foreground">
              {progress.toString()} / {target.toString()}
            </span>
          </div>
          <Progress
            value={percent}
            className="h-2.5 bg-muted"
            aria-label={`${quest.title} progress`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {claimed ? (
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-success/40 bg-success/10 text-success"
              >
                <CheckCircle2 className="size-3" />
                Reward claimed
              </Badge>
            ) : completed ? (
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-success/40 bg-success/10 text-success"
              >
                <CheckCircle2 className="size-3" />
                Completed
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-warning/40 bg-warning/10 text-warning"
              >
                <CircleDashed className="size-3" />
                In progress
              </Badge>
            )}
          </div>

          <Button
            type="button"
            data-ocid={`quests.claim_button.${index + 1}`}
            disabled={!canClaim || isClaiming}
            onClick={() => onClaim(quest.id)}
            className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110 disabled:opacity-50"
          >
            {isClaiming ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Claiming…
              </>
            ) : claimed ? (
              <>
                <CheckCircle2 className="size-4" />
                Claimed
              </>
            ) : (
              <>
                <Gift className="size-4" />
                Claim reward
              </>
            )}
          </Button>
        </div>

        {justClaimed && (
          <p
            data-ocid={`quests.success_state.${index + 1}`}
            className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            Reward claimed — {formatXp(quest.xpReward)} XP added to your total.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuestSkeleton() {
  return (
    <Card className="glass rounded-2xl border-border shadow-glass">
      <CardContent className="flex flex-col gap-4 py-1">
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuestsPage() {
  const {
    data: quests,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDailyQuests();
  const claimReward = useClaimQuestReward();
  const [claimedId, setClaimedId] = useState<string | null>(null);

  const list = quests ?? [];
  const completedCount = list.filter((q) => q.completed).length;
  const claimableCount = list.filter((q) => q.completed && !q.claimed).length;

  const handleClaim = (questId: QuestView["quest"]["id"]) => {
    setClaimedId(null);
    claimReward.mutate(questId, {
      onSuccess: () => setClaimedId(questId.toString()),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily objectives"
        title="Quests"
        description="Complete today's quests to earn bonus XP and keep your streak alive."
        actions={
          <Button
            type="button"
            variant="outline"
            data-ocid="quests.refresh_button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-xl border-border bg-card/60 transition-smooth hover:border-primary/40"
          >
            <RefreshCw
              className={isFetching ? "size-4 animate-spin" : "size-4"}
            />
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <div
          data-ocid="quests.loading_state"
          className="grid gap-4 md:gap-6"
          aria-busy="true"
        >
          {Array.from({ length: 3 }, (_, i) => `quest-skeleton-${i}`).map(
            (id) => (
              <QuestSkeleton key={id} />
            ),
          )}
        </div>
      ) : isError ? (
        <Card
          data-ocid="quests.error_state"
          className="glass rounded-2xl border-destructive/30 shadow-glass"
        >
          <CardContent className="flex flex-col items-start gap-4 py-2">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                We couldn't load today's quests
              </h2>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching your quests. Check your
                connection and try again.
              </p>
            </div>
            <Button
              type="button"
              data-ocid="quests.retry_button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110"
            >
              <RefreshCw
                className={isFetching ? "size-4 animate-spin" : "size-4"}
              />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card
          data-ocid="quests.empty_state"
          className="glass rounded-2xl border-border shadow-glass"
        >
          <CardContent className="flex flex-col items-start gap-4 py-2">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
              <Trophy className="size-6" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                No quests available today
              </h2>
              <p className="text-sm text-muted-foreground">
                New daily quests appear here automatically. Check back soon to
                keep your streak going.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="glass rounded-2xl border-border shadow-glass">
              <CardContent className="flex items-center gap-3 py-1">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Target className="size-5" />
                </span>
                <div>
                  <p className="font-mono text-xl font-semibold text-foreground">
                    {completedCount}/{list.length}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Completed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass rounded-2xl border-border shadow-glass">
              <CardContent className="flex items-center gap-3 py-1">
                <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Gift className="size-5" />
                </span>
                <div>
                  <p className="font-mono text-xl font-semibold text-foreground">
                    {claimableCount}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Ready to claim
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-6">
            {list.map((view, index) => (
              <QuestCard
                key={view.quest.id.toString()}
                view={view}
                index={index}
                onClaim={handleClaim}
                isClaiming={
                  claimReward.isPending &&
                  claimReward.variables?.toString() === view.quest.id.toString()
                }
                justClaimed={claimedId === view.quest.id.toString()}
              />
            ))}
          </div>

          {claimReward.isError && (
            <p
              data-ocid="quests.claim_error_state"
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertTriangle className="size-4 shrink-0" />
              We couldn't claim that reward. Please try again.
            </p>
          )}
        </>
      )}
    </div>
  );
}
