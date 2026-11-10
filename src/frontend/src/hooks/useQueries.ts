import { createActor } from "@/backend";
import type {
  DayKey,
  Id,
  LeaderboardScope,
  PlanTier,
  QuestGoal,
  ResourceFilter,
  StoreItemKind,
  Timestamp,
  UserId,
  WeekKey,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Shared query keys so mutations can invalidate precisely. */
export const queryKeys = {
  profile: ["profile"] as const,
  dashboard: ["dashboard"] as const,
  goal: ["goal"] as const,
  sessions: ["sessions"] as const,
  dailyReport: (dayKey: DayKey) => ["report", "daily", dayKey] as const,
  weeklyReport: (weekKey: WeekKey) => ["report", "weekly", weekKey] as const,
  weekTotals: (weekKey: WeekKey) => ["report", "week-totals", weekKey] as const,
  quests: ["quests"] as const,
  store: ["store"] as const,
  purchases: ["purchases"] as const,
  membership: ["membership"] as const,
  plans: ["plans"] as const,
  themes: ["themes"] as const,
  resources: (filter: ResourceFilter) => ["resources", filter] as const,
  resource: (id: Id) => ["resource", id.toString()] as const,
  websiteLinks: ["website-links"] as const,
  leaderboard: (scope: LeaderboardScope) => ["leaderboard", scope] as const,
  achievements: ["achievements"] as const,
  adminStudents: ["admin", "students"] as const,
  adminAnalytics: ["admin", "analytics"] as const,
  callerRole: ["caller-role"] as const,
  isAdmin: ["is-admin"] as const,
};

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function useCallerProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { username: string; displayName: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProfile(input.username, input.displayName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { displayName: string; bio: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProfile(input.displayName, input.bio);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useStudentProfile(student: UserId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["profile", "student", student?.toText() ?? "none"],
    queryFn: async () => {
      if (!actor || !student) return null;
      return actor.getProfile(student);
    },
    enabled: !!actor && !isFetching && !!student,
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard, goal and reports                                         */
/* ------------------------------------------------------------------ */

export function useDashboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getDashboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGoal() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.goal,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getGoal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetDailyGoal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dailyGoalMinutes: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setDailyGoal(dailyGoalMinutes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goal });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDailyReport(dayKey: DayKey) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.dailyReport(dayKey),
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getDailyReport(dayKey);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeeklyReport(weekKey: WeekKey) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.weeklyReport(weekKey),
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getWeeklyReport(weekKey);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeekDailyTotals(weekKey: WeekKey) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.weekTotals(weekKey),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWeekDailyTotals(weekKey);
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Study sessions                                                      */
/* ------------------------------------------------------------------ */

export function useStudySessions() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listStudySessions();
    },
    enabled: !!actor && !isFetching,
  });
}

function invalidateStudyData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  void queryClient.invalidateQueries({ queryKey: queryKeys.goal });
  void queryClient.invalidateQueries({ queryKey: ["report"] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.quests });
  void queryClient.invalidateQueries({ queryKey: queryKeys.achievements });
}

export function useStartStudySession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subject: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.startStudySession(subject);
    },
    onSuccess: () => invalidateStudyData(queryClient),
  });
}

export function usePauseStudySession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.pauseStudySession(sessionId);
    },
    onSuccess: () => invalidateStudyData(queryClient),
  });
}

export function useResumeStudySession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.resumeStudySession(sessionId);
    },
    onSuccess: () => invalidateStudyData(queryClient),
  });
}

export function useFinishStudySession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.finishStudySession(sessionId);
    },
    onSuccess: () => invalidateStudyData(queryClient),
  });
}

/* ------------------------------------------------------------------ */
/* Quests                                                              */
/* ------------------------------------------------------------------ */

export function useDailyQuests() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.quests,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDailyQuests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimQuestReward() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.claimQuestReward(questId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useAdminCreateQuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      goal: QuestGoal;
      xpReward: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminCreateQuest(
        input.title,
        input.description,
        input.goal,
        input.xpReward,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quests });
    },
  });
}

export function useAdminUpdateQuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      questId: Id;
      title: string;
      description: string;
      goal: QuestGoal;
      xpReward: bigint;
      active: boolean;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminUpdateQuest(
        input.questId,
        input.title,
        input.description,
        input.goal,
        input.xpReward,
        input.active,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quests });
    },
  });
}

export function useAdminDeleteQuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminDeleteQuest(questId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quests });
    },
  });
}

/* ------------------------------------------------------------------ */
/* XP store                                                            */
/* ------------------------------------------------------------------ */

export function useStoreItems() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.store,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listStoreItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePurchaseHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.purchases,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPurchaseHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePurchaseStoreItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.purchaseStoreItem(itemId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.store });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchases });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useAdminCreateStoreItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      kind: StoreItemKind;
      xpPrice: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminCreateStoreItem(
        input.name,
        input.description,
        input.kind,
        input.xpPrice,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.store });
    },
  });
}

export function useAdminUpdateStoreItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      itemId: Id;
      name: string;
      description: string;
      kind: StoreItemKind;
      xpPrice: bigint;
      active: boolean;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminUpdateStoreItem(
        input.itemId,
        input.name,
        input.description,
        input.kind,
        input.xpPrice,
        input.active,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.store });
    },
  });
}

export function useAdminDeleteStoreItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminDeleteStoreItem(itemId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.store });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Membership                                                          */
/* ------------------------------------------------------------------ */

export function useMembership() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.membership,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getMembership();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMembershipPlans() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMembershipPlans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBeginMembershipPurchase() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tier: PlanTier; paymentReference: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.beginMembershipPurchase(input.tier, input.paymentReference);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.membership });
    },
  });
}

export function useVerifyMembershipPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentReference: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.verifyMembershipPayment(paymentReference);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.membership });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useAdminSetMembership() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      student: UserId;
      tier: PlanTier;
      expiresAt: Timestamp;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminSetMembership(
        input.student,
        input.tier,
        input.expiresAt,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

export function useThemes() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.themes,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listThemes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApplyTheme() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (themeId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.applyTheme(themeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.themes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useAdminCreateTheme() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      premium: boolean;
      cssVariables: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminCreateTheme(
        input.name,
        input.description,
        input.premium,
        input.cssVariables,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.themes });
    },
  });
}

export function useAdminUpdateTheme() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      themeId: Id;
      name: string;
      description: string;
      premium: boolean;
      cssVariables: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminUpdateTheme(
        input.themeId,
        input.name,
        input.description,
        input.premium,
        input.cssVariables,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.themes });
    },
  });
}

export function useAdminDeleteTheme() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (themeId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminDeleteTheme(themeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.themes });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Study library                                                       */
/* ------------------------------------------------------------------ */

export function useSearchResources(filter: ResourceFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.resources(filter),
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchResources(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResource(resourceId: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.resource(resourceId ?? 0n),
    queryFn: async () => {
      if (!actor || resourceId === undefined) return null;
      return actor.getResource(resourceId);
    },
    enabled: !!actor && !isFetching && resourceId !== undefined,
  });
}

export function useRecordResourceDownload() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resourceId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.recordResourceDownload(resourceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useAdminCreateResource() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      category: string;
      subject: string;
      classLevel: string;
      board: string;
      file: Uint8Array;
      fileName: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminCreateResource(
        input.title,
        input.description,
        input.category,
        input.subject,
        input.classLevel,
        input.board,
        input.file,
        input.fileName,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useAdminUpdateResource() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      resourceId: Id;
      title: string;
      description: string;
      category: string;
      subject: string;
      classLevel: string;
      board: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminUpdateResource(
        input.resourceId,
        input.title,
        input.description,
        input.category,
        input.subject,
        input.classLevel,
        input.board,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useAdminDeleteResource() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resourceId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminDeleteResource(resourceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Website hub                                                         */
/* ------------------------------------------------------------------ */

export function useWebsiteLinks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.websiteLinks,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listWebsiteLinks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminAddWebsiteLink() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      url: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminAddWebsiteLink(
        input.name,
        input.description,
        input.url,
        input.category,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.websiteLinks });
    },
  });
}

export function useAdminRemoveWebsiteLink() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminRemoveWebsiteLink(linkId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.websiteLinks });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Leaderboard                                                         */
/* ------------------------------------------------------------------ */

export function useLeaderboard(scope: LeaderboardScope, limit = 50n) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.leaderboard(scope),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard(scope, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFriend() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friend: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addFriend(friend);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useRemoveFriend() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friend: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeFriend(friend);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export function useAchievements() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAchievements();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.callerRole,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminStudents() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.adminStudents,
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminListStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminAnalytics() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.adminAnalytics,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminGetAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminRemoveStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminRemoveStudent(student);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminAnalytics,
      });
    },
  });
}

export function useAdminFlagStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminFlagStudent(student);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useAdminClearStudentFlag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.adminClearStudentFlag(student);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
