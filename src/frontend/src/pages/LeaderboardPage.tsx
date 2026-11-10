import { LeaderboardScope as Scope } from "@/backend";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  LeaderboardEmptyState,
  LeaderboardErrorState,
  LeaderboardRow,
  LeaderboardSkeleton,
} from "@/components/leaderboard/LeaderboardParts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAddFriend,
  useCallerProfile,
  useLeaderboard,
  useRemoveFriend,
} from "@/hooks/useQueries";
import type { LeaderboardScope, UserId } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutationState } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const SCOPES: { value: LeaderboardScope; label: string; hint: string }[] = [
  {
    value: Scope.global,
    label: "Global",
    hint: "All-time XP across every student",
  },
  { value: Scope.weekly, label: "Weekly", hint: "XP earned this week" },
  { value: Scope.monthly, label: "Monthly", hint: "XP earned this month" },
  {
    value: Scope.friends,
    label: "Friends",
    hint: "You and the students you follow",
  },
];

function ScopeBoard({
  scope,
  selfId,
  friendIds,
  onAdd,
  onRemove,
  pendingIds,
  onExplore,
}: {
  scope: LeaderboardScope;
  selfId: string | undefined;
  friendIds: Set<string>;
  onAdd: (student: UserId) => void;
  onRemove: (student: UserId) => void;
  pendingIds: Set<string>;
  onExplore: () => void;
}) {
  const { data, isLoading, isError, refetch } = useLeaderboard(scope);
  const entries = data ?? [];
  const canManageFriends = scope !== Scope.friends;

  if (isLoading) return <LeaderboardSkeleton />;
  if (isError) return <LeaderboardErrorState onRetry={() => void refetch()} />;
  if (entries.length === 0) {
    return <LeaderboardEmptyState scope={scope} onExplore={onExplore} />;
  }

  return (
    <ul data-ocid="leaderboard.list" className="space-y-3">
      {entries.map((entry, index) => {
        const studentText = entry.student.toText();
        return (
          <LeaderboardRow
            key={studentText}
            entry={entry}
            index={index}
            isSelf={studentText === selfId}
            canManageFriends={canManageFriends}
            isFriend={friendIds.has(studentText)}
            onAdd={onAdd}
            onRemove={onRemove}
            pending={pendingIds.has(studentText)}
          />
        );
      })}
    </ul>
  );
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>(Scope.global);
  const { identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();

  const selfId =
    identity && !identity.getPrincipal().isAnonymous()
      ? identity.getPrincipal().toText()
      : profile?.id.toText();

  // Friend ids come from the friends board itself, which the backend scopes to
  // the caller's own friend list.
  const { data: friendsData } = useLeaderboard(Scope.friends);
  const friendIds = useMemo(
    () => new Set((friendsData ?? []).map((entry) => entry.student.toText())),
    [friendsData],
  );

  const pendingMutations = useMutationState({
    filters: { status: "pending" },
    select: (mutation) => mutation.state.variables as UserId | undefined,
  });
  const pendingIds = useMemo(
    () =>
      new Set(
        pendingMutations
          .filter((value): value is UserId => value !== undefined)
          .map((value) => value.toText()),
      ),
    [pendingMutations],
  );

  const handleAdd = (student: UserId) => addFriend.mutate(student);
  const handleRemove = (student: UserId) => removeFriend.mutate(student);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Compete"
        title="Leaderboard"
        description="See how your XP and level stack up across global, weekly, monthly and friends boards."
      />

      <Tabs
        value={scope}
        onValueChange={(value) => setScope(value as LeaderboardScope)}
        className="gap-5"
      >
        <TabsList
          data-ocid="leaderboard.tabs"
          className="glass h-auto w-full flex-wrap justify-start gap-1 rounded-2xl p-1.5 sm:w-fit"
        >
          {SCOPES.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              data-ocid={`leaderboard.${item.value}.tab`}
              className="flex-1 rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glass sm:flex-none"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SCOPES.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">{item.hint}</p>
            <ScopeBoard
              scope={item.value}
              selfId={selfId}
              friendIds={friendIds}
              onAdd={handleAdd}
              onRemove={handleRemove}
              pendingIds={pendingIds}
              onExplore={() => setScope(Scope.global)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
