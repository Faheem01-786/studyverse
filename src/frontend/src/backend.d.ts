import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface Achievement {
    key: AchievementKey;
    title: string;
    xpReward: Xp;
    description: string;
}
export interface AchievementView {
    achievement: Achievement;
    earnedAt?: Timestamp;
    earned: boolean;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface DailyStudyTotal {
    xp: Xp;
    dayKey: DayKey;
    minutes: bigint;
}
export interface Dashboard {
    goal: StudyGoal;
    levelProgressPercent: bigint;
    xpThisWeek: Xp;
    studyMinutesThisWeek: bigint;
    studyMinutesToday: bigint;
    xpToNextLevel: Xp;
    xpToday: Xp;
    profile: Profile;
}
export type DayKey = string;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Id = bigint;
export interface LeaderboardEntry {
    xp: Xp;
    username: string;
    avatarItemId?: Id;
    displayName: string;
    rank: bigint;
    level: Level;
    student: UserId;
    frameItemId?: Id;
}
export type Level = bigint;
export interface MembershipView {
    active: boolean;
    expiresAt?: Timestamp;
    xpMultiplier: bigint;
    tier?: PlanTier;
}
export interface Plan {
    xpMultiplier: bigint;
    name: string;
    tier: PlanTier;
    priceRupees: Rupees;
    benefits: Array<string>;
}
export interface PlatformAnalytics {
    totalXpAwarded: Xp;
    totalResources: bigint;
    activeStudentsToday: bigint;
    totalStudents: bigint;
    totalPurchases: bigint;
    totalStudyMinutes: bigint;
    totalQuests: bigint;
    activeMemberships: bigint;
}
export interface Profile {
    id: UserId;
    xp: Xp;
    bio: string;
    username: string;
    avatarItemId?: Id;
    displayName: string;
    createdAt: Timestamp;
    level: Level;
    appliedThemeId: Id;
    updatedAt: Timestamp;
    frameItemId?: Id;
}
export interface ProfileView {
    id: UserId;
    xp: Xp;
    username: string;
    avatarItemId?: Id;
    displayName: string;
    level: Level;
    frameItemId?: Id;
}
export interface Purchase {
    id: Id;
    itemId: Id;
    owner: UserId;
    xpSpent: Xp;
    purchasedAt: Timestamp;
}
export interface Quest {
    id: Id;
    title: string;
    active: boolean;
    xpReward: Xp;
    goal: QuestGoal;
    createdAt: Timestamp;
    description: string;
}
export type QuestGoal = {
    __kind__: "solveQuestions";
    solveQuestions: bigint;
} | {
    __kind__: "studyMinutes";
    studyMinutes: bigint;
} | {
    __kind__: "finishSession";
    finishSession: null;
} | {
    __kind__: "completeChapter";
    completeChapter: null;
} | {
    __kind__: "reachDailyGoal";
    reachDailyGoal: null;
};
export interface QuestView {
    completed: boolean;
    quest: Quest;
    claimed: boolean;
    progress: bigint;
    target: bigint;
}
export interface ResourceFilter {
    subject?: string;
    searchTerm?: string;
    category?: string;
    classLevel?: string;
    board?: string;
}
export interface ResourceView {
    id: Id;
    title: string;
    subject: string;
    file: ExternalBlob;
    createdAt: Timestamp;
    description: string;
    fileName: string;
    category: string;
    downloadCount: bigint;
    classLevel: string;
    board: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Rupees = bigint;
export interface StoreItem {
    id: Id;
    active: boolean;
    kind: StoreItemKind;
    name: string;
    createdAt: Timestamp;
    description: string;
    xpPrice: Xp;
}
export interface StoreItemView {
    owned: boolean;
    item: StoreItem;
}
export interface StudentSummary {
    id: UserId;
    xp: Xp;
    username: string;
    displayName: string;
    createdAt: Timestamp;
    level: Level;
    membershipTier?: string;
}
export interface StudyGoal {
    currentStreakDays: bigint;
    lastStudyDay?: DayKey;
    longestStreakDays: bigint;
    dailyGoalMinutes: bigint;
}
export interface StudyReport {
    totalXp: Xp;
    bySubject: Array<[string, bigint]>;
    sessionCount: bigint;
    totalMinutes: bigint;
}
export interface StudySessionView {
    id: Id;
    status: SessionStatus;
    startedAt: Timestamp;
    subject: string;
    rewardedXp?: Xp;
    finishedAt?: Timestamp;
    accumulatedSeconds: bigint;
}
export interface Subscription {
    status: PaymentStatus;
    startedAt?: Timestamp;
    expiresAt?: Timestamp;
    owner: UserId;
    tier: PlanTier;
    paymentReference?: string;
}
export interface Theme {
    id: Id;
    premium: boolean;
    name: string;
    createdAt: Timestamp;
    description: string;
    cssVariables: string;
}
export interface ThemeView {
    theme: Theme;
    applied: boolean;
    unlocked: boolean;
}
export type Timestamp = bigint;
export type UserId = Principal;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface WebsiteLink {
    id: Id;
    url: string;
    name: string;
    createdAt: Timestamp;
    description: string;
    category: string;
}
export type WeekKey = string;
export type Xp = bigint;
export enum AchievementKey {
    xpChampion = "xpChampion",
    sevenDayStreak = "sevenDayStreak",
    thirtyDayStreak = "thirtyDayStreak",
    questMaster = "questMaster",
    fiveHourLearner = "fiveHourLearner",
    firstStudySession = "firstStudySession"
}
export enum LeaderboardScope {
    global = "global",
    monthly = "monthly",
    friends = "friends",
    weekly = "weekly"
}
export enum PaymentStatus {
    verified = "verified",
    pending = "pending",
    failed = "failed"
}
export enum PlanTier {
    advanced = "advanced",
    ultimate = "ultimate",
    moderate = "moderate"
}
export enum SessionStatus {
    finished = "finished",
    running = "running",
    paused = "paused"
}
export enum StoreItemKind {
    frame = "frame",
    resource = "resource",
    dashboardTheme = "dashboardTheme",
    badge = "badge",
    avatar = "avatar",
    digitalReward = "digitalReward"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Add a friend for the caller.
     */
    addFriend(friend: UserId): Promise<void>;
    /**
     * / Add a website link (admin).
     */
    adminAddWebsiteLink(name: string, description: string, url: string, category: string): Promise<WebsiteLink>;
    /**
     * / Clear a student's leaderboard flag (admin).
     */
    adminClearStudentFlag(student: UserId): Promise<void>;
    /**
     * / Create a quest (admin).
     */
    adminCreateQuest(title: string, description: string, goal: QuestGoal, xpReward: Xp): Promise<Quest>;
    /**
     * / Upload a library resource (admin).
     */
    adminCreateResource(title: string, description: string, category: string, subject: string, classLevel: string, board: string, file: Uint8Array, fileName: string): Promise<ResourceView>;
    /**
     * / Create a store item (admin).
     */
    adminCreateStoreItem(name: string, description: string, kind: StoreItemKind, xpPrice: Xp): Promise<StoreItem>;
    /**
     * / Create a theme (admin).
     */
    adminCreateTheme(name: string, description: string, premium: boolean, cssVariables: string): Promise<Theme>;
    /**
     * / Delete a quest (admin).
     */
    adminDeleteQuest(questId: Id): Promise<void>;
    /**
     * / Delete a resource (admin).
     */
    adminDeleteResource(resourceId: Id): Promise<void>;
    /**
     * / Delete a store item (admin).
     */
    adminDeleteStoreItem(itemId: Id): Promise<void>;
    /**
     * / Delete a theme (admin).
     */
    adminDeleteTheme(themeId: Id): Promise<void>;
    /**
     * / Flag a student's leaderboard entry (admin).
     */
    adminFlagStudent(student: UserId): Promise<void>;
    /**
     * / Platform analytics (admin).
     */
    adminGetAnalytics(): Promise<PlatformAnalytics>;
    /**
     * / List all students (admin).
     */
    adminListStudents(): Promise<Array<StudentSummary>>;
    /**
     * / Remove a student (admin).
     */
    adminRemoveStudent(student: UserId): Promise<void>;
    /**
     * / Remove a website link (admin).
     */
    adminRemoveWebsiteLink(linkId: Id): Promise<void>;
    /**
     * / Grant or revoke a membership (admin).
     */
    adminSetMembership(student: UserId, tier: PlanTier, expiresAt: Timestamp): Promise<Subscription>;
    /**
     * / Update a quest (admin).
     */
    adminUpdateQuest(questId: Id, title: string, description: string, goal: QuestGoal, xpReward: Xp, active: boolean): Promise<Quest>;
    /**
     * / Update a resource's metadata (admin).
     */
    adminUpdateResource(resourceId: Id, title: string, description: string, category: string, subject: string, classLevel: string, board: string): Promise<ResourceView>;
    /**
     * / Update a store item (admin).
     */
    adminUpdateStoreItem(itemId: Id, name: string, description: string, kind: StoreItemKind, xpPrice: Xp, active: boolean): Promise<StoreItem>;
    /**
     * / Update a theme (admin).
     */
    adminUpdateTheme(themeId: Id, name: string, description: string, premium: boolean, cssVariables: string): Promise<Theme>;
    /**
     * / Apply a theme the caller may use.
     */
    applyTheme(themeId: Id): Promise<Theme>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Begin a membership purchase; benefits stay inactive until verified.
     */
    beginMembershipPurchase(tier: PlanTier, paymentReference: string): Promise<Subscription>;
    /**
     * / Claim a completed quest's XP reward.
     */
    claimQuestReward(questId: Id): Promise<Xp>;
    /**
     * / Create the caller's profile on first sign-in.
     */
    createProfile(username: string, displayName: string): Promise<Profile>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Finish a session; XP is derived from server-measured elapsed time,
     * / credited to the profile with the active membership multiplier, and
     * / reflected in the streak, quest progress and achievements.
     */
    finishStudySession(sessionId: Id): Promise<StudySessionView>;
    getApiDoc(): Promise<string>;
    /**
     * / Fetch the caller's own profile.
     */
    getCallerProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / The caller's study report for a day.
     */
    getDailyReport(dayKey: DayKey): Promise<StudyReport>;
    /**
     * / Read the caller's dashboard summary.
     */
    getDashboard(): Promise<Dashboard>;
    /**
     * / Read the caller's goal and streak state.
     */
    getGoal(): Promise<StudyGoal>;
    /**
     * / Fetch a ranked leaderboard for the requested scope.
     * / Global ranks by total XP; weekly and monthly rank by XP earned in the
     * / current week or month from real session and quest data.
     */
    getLeaderboard(scope: LeaderboardScope, limit: bigint): Promise<Array<LeaderboardEntry>>;
    /**
     * / The caller's membership state.
     */
    getMembership(): Promise<MembershipView>;
    /**
     * / Fetch any student's public profile.
     */
    getProfile(student: UserId): Promise<ProfileView | null>;
    /**
     * / The caller's purchase history.
     */
    getPurchaseHistory(): Promise<Array<Purchase>>;
    /**
     * / Fetch one resource.
     */
    getResource(resourceId: Id): Promise<ResourceView | null>;
    /**
     * / The caller's per-day totals for a week.
     */
    getWeekDailyTotals(weekKey: WeekKey): Promise<Array<DailyStudyTotal>>;
    /**
     * / The caller's study report for a week.
     */
    getWeeklyReport(weekKey: WeekKey): Promise<StudyReport>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the achievement catalogue with the caller's earned state.
     */
    listAchievements(): Promise<Array<AchievementView>>;
    /**
     * / List today's quests with the caller's progress.
     */
    listDailyQuests(): Promise<Array<QuestView>>;
    /**
     * / The available membership plans.
     */
    listMembershipPlans(): Promise<Array<Plan>>;
    /**
     * / List store items with the caller's ownership.
     */
    listStoreItems(): Promise<Array<StoreItemView>>;
    /**
     * / List the caller's study sessions.
     */
    listStudySessions(): Promise<Array<StudySessionView>>;
    /**
     * / List themes with the caller's unlock and applied state.
     */
    listThemes(): Promise<Array<ThemeView>>;
    /**
     * / List all website links.
     */
    listWebsiteLinks(): Promise<Array<WebsiteLink>>;
    /**
     * / Pause a running session.
     */
    pauseStudySession(sessionId: Id): Promise<StudySessionView>;
    /**
     * / Purchase an item with XP.
     */
    purchaseStoreItem(itemId: Id): Promise<Purchase>;
    /**
     * / Record a resource download.
     */
    recordResourceDownload(resourceId: Id): Promise<bigint>;
    /**
     * / Remove a friend for the caller.
     */
    removeFriend(friend: UserId): Promise<void>;
    /**
     * / Resume a paused session.
     */
    resumeStudySession(sessionId: Id): Promise<StudySessionView>;
    schema(): Promise<string>;
    /**
     * / Search and filter library resources.
     */
    searchResources(filter: ResourceFilter): Promise<Array<ResourceView>>;
    /**
     * / Set the caller's daily study goal in minutes.
     */
    setDailyGoal(dailyGoalMinutes: bigint): Promise<StudyGoal>;
    /**
     * / Start a new study session.
     */
    startStudySession(subject: string): Promise<StudySessionView>;
    /**
     * / Update the caller's profile.
     */
    updateProfile(displayName: string, bio: string): Promise<Profile>;
    /**
     * / Verify a payment and activate benefits.
     */
    verifyMembershipPayment(paymentReference: string): Promise<Subscription>;
}
