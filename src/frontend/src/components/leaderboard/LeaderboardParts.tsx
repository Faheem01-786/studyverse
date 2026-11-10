import { LeaderboardScope as Scope } from "@/backend";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLevel, formatXp, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardScope, UserId } from "@/types";
import { Crown, Medal, Trophy, UserPlus, UserX, Users } from "lucide-react";

/** Rank medal styling for the top three positions. */
function rankAccent(rank: number): string {
  if (rank === 1) return "text-warning";
  if (rank === 2) return "text-muted-foreground";
  if (rank === 3) return "text-accent";
  return "text-muted-foreground";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const Icon = rank === 1 ? Crown : Medal;
    return (
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-secondary/70",
          rankAccent(rank),
        )}
        aria-label={`Rank ${rank}`}
      >
        <Icon className="size-4" />
      </span>
    );
  }
  return (
    <span
      className="flex size-9 items-center justify-center rounded-xl bg-secondary/50 font-mono text-sm font-semibold text-muted-foreground"
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

export function LeaderboardRow({
  entry,
  isSelf,
  canManageFriends,
  isFriend,
  onAdd,
  onRemove,
  pending,
  index,
}: {
  entry: LeaderboardEntry;
  isSelf: boolean;
  canManageFriends: boolean;
  isFriend: boolean;
  onAdd: (student: UserId) => void;
  onRemove: (student: UserId) => void;
  pending: boolean;
  index: number;
}) {
  const rank = Number(entry.rank);
  return (
    <li
      data-ocid={`leaderboard.row.${index + 1}`}
      className={cn(
        "glass flex items-center gap-3 rounded-2xl px-3 py-3 transition-smooth sm:gap-4 sm:px-4",
        isSelf
          ? "glow-ring border-primary/40 bg-primary/10"
          : "hover:border-primary/30 hover:bg-secondary/40",
      )}
    >
      <RankBadge rank={rank} />

      <Avatar className="size-10 shrink-0 border border-border">
        <AvatarFallback className="bg-gradient-primary text-sm font-semibold text-primary-foreground">
          {initials(entry.displayName || entry.username)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground">
            {entry.displayName || entry.username}
          </p>
          {isSelf && (
            <Badge
              variant="secondary"
              className="shrink-0 border-primary/40 bg-primary/15 text-primary"
            >
              You
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          @{entry.username}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono text-sm font-semibold text-foreground">
          {formatXp(entry.xp)}
        </p>
        <p className="text-xs text-muted-foreground">XP</p>
      </div>

      <Badge
        variant="outline"
        className="shrink-0 border-border bg-secondary/50 font-mono text-xs text-foreground"
      >
        {formatLevel(entry.level)}
      </Badge>

      {canManageFriends && !isSelf && (
        <Button
          type="button"
          size="sm"
          variant={isFriend ? "ghost" : "secondary"}
          data-ocid={
            isFriend
              ? `leaderboard.remove_friend_button.${index + 1}`
              : `leaderboard.add_friend_button.${index + 1}`
          }
          disabled={pending}
          onClick={() =>
            isFriend ? onRemove(entry.student) : onAdd(entry.student)
          }
          className="shrink-0 gap-1.5"
        >
          {isFriend ? (
            <>
              <UserX className="size-4" />
              <span className="hidden md:inline">Remove</span>
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              <span className="hidden md:inline">Add</span>
            </>
          )}
        </Button>
      )}
    </li>
  );
}

export function LeaderboardSkeleton() {
  const ids = Array.from({ length: 6 }, (_, i) => `leaderboard-skeleton-${i}`);
  return (
    <ul data-ocid="leaderboard.loading_state" className="space-y-3">
      {ids.map((id) => (
        <li
          key={id}
          className="glass flex items-center gap-4 rounded-2xl px-4 py-3"
        >
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function LeaderboardEmptyState({
  scope,
  onExplore,
}: {
  scope: LeaderboardScope;
  onExplore: () => void;
}) {
  const isFriends = scope === Scope.friends;
  return (
    <Card
      data-ocid="leaderboard.empty_state"
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
          {isFriends ? (
            <Users className="size-7" />
          ) : (
            <Trophy className="size-7" />
          )}
        </span>
        <div className="space-y-1.5">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isFriends ? "No friends yet" : "No rankings yet"}
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {isFriends
              ? "Add study buddies from the global board to compare your XP and climb together."
              : "Once students start earning XP, their rankings will appear here."}
          </p>
        </div>
        {isFriends && (
          <Button
            type="button"
            data-ocid="leaderboard.explore_button"
            onClick={onExplore}
            className="gap-2 rounded-full bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:opacity-90"
          >
            <UserPlus className="size-4" />
            Find friends on the global board
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card
      data-ocid="leaderboard.error_state"
      className="glass rounded-2xl border-destructive/40 shadow-glass"
    >
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <Trophy className="size-7" />
        </span>
        <div className="space-y-1.5">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Could not load the leaderboard
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Something went wrong while fetching the rankings. Please try again.
          </p>
        </div>
        <Button
          type="button"
          data-ocid="leaderboard.retry_button"
          onClick={onRetry}
          className="rounded-full bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:opacity-90"
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
