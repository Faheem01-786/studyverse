import {
  LeaderboardScope,
  PlanTier as PlanTierEnum,
  StoreItemKind as StoreItemKindEnum,
} from "@/backend";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminAddWebsiteLink,
  useAdminAnalytics,
  useAdminClearStudentFlag,
  useAdminCreateQuest,
  useAdminCreateResource,
  useAdminCreateStoreItem,
  useAdminCreateTheme,
  useAdminDeleteQuest,
  useAdminDeleteResource,
  useAdminDeleteStoreItem,
  useAdminDeleteTheme,
  useAdminFlagStudent,
  useAdminRemoveStudent,
  useAdminRemoveWebsiteLink,
  useAdminSetMembership,
  useAdminStudents,
  useAdminUpdateQuest,
  useAdminUpdateResource,
  useAdminUpdateStoreItem,
  useAdminUpdateTheme,
  useDailyQuests,
  useLeaderboard,
  useSearchResources,
  useStoreItems,
  useThemes,
  useWebsiteLinks,
} from "@/hooks/useQueries";
import { formatDate, formatMinutes, formatXp } from "@/lib/format";
import type {
  LeaderboardEntry,
  PlanTier,
  QuestGoal,
  QuestView,
  ResourceView,
  StoreItemKind,
  StoreItemView,
  StudentSummary,
  ThemeView,
  WebsiteLink,
} from "@/types";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Flag,
  Globe,
  GraduationCap,
  Layers,
  Loader2,
  Palette,
  Pencil,
  Plus,
  ShoppingBag,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const QUEST_GOAL_OPTIONS: { value: QuestGoal["__kind__"]; label: string }[] = [
  { value: "studyMinutes", label: "Study minutes" },
  { value: "solveQuestions", label: "Solve questions" },
  { value: "finishSession", label: "Finish a session" },
  { value: "completeChapter", label: "Complete a chapter" },
  { value: "reachDailyGoal", label: "Reach daily goal" },
];

const STORE_KIND_OPTIONS: { value: StoreItemKind; label: string }[] = [
  { value: StoreItemKindEnum.avatar, label: "Avatar" },
  { value: StoreItemKindEnum.frame, label: "Frame" },
  { value: StoreItemKindEnum.badge, label: "Badge" },
  { value: StoreItemKindEnum.dashboardTheme, label: "Dashboard theme" },
  { value: StoreItemKindEnum.resource, label: "Resource" },
  { value: StoreItemKindEnum.digitalReward, label: "Digital reward" },
];

const PLAN_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: PlanTierEnum.moderate, label: "Moderate" },
  { value: PlanTierEnum.advanced, label: "Advanced" },
  { value: PlanTierEnum.ultimate, label: "Ultimate" },
];

function goalLabel(goal: QuestGoal): string {
  switch (goal.__kind__) {
    case "studyMinutes":
      return `${goal.studyMinutes.toString()} study minutes`;
    case "solveQuestions":
      return `${goal.solveQuestions.toString()} questions`;
    case "finishSession":
      return "Finish a session";
    case "completeChapter":
      return "Complete a chapter";
    case "reachDailyGoal":
      return "Reach daily goal";
    default:
      return "Goal";
  }
}

function buildGoal(kind: QuestGoal["__kind__"], amount: number): QuestGoal {
  switch (kind) {
    case "studyMinutes":
      return {
        __kind__: "studyMinutes",
        studyMinutes: BigInt(Math.max(1, amount)),
      };
    case "solveQuestions":
      return {
        __kind__: "solveQuestions",
        solveQuestions: BigInt(Math.max(1, amount)),
      };
    case "finishSession":
      return { __kind__: "finishSession", finishSession: null };
    case "completeChapter":
      return { __kind__: "completeChapter", completeChapter: null };
    case "reachDailyGoal":
      return { __kind__: "reachDailyGoal", reachDailyGoal: null };
    default:
      return { __kind__: "finishSession", finishSession: null };
  }
}

function goalNeedsAmount(kind: QuestGoal["__kind__"]): boolean {
  return kind === "studyMinutes" || kind === "solveQuestions";
}

function goalAmount(goal: QuestGoal): number {
  if (goal.__kind__ === "studyMinutes") return Number(goal.studyMinutes);
  if (goal.__kind__ === "solveQuestions") return Number(goal.solveQuestions);
  return 0;
}

/** Inline feedback line for a mutation result. */
function Feedback({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;
  return (
    <p
      data-ocid={error ? "admin.error_state" : "admin.success_state"}
      className={
        error
          ? "flex items-center gap-1.5 text-xs font-medium text-destructive"
          : "flex items-center gap-1.5 text-xs font-medium text-success"
      }
    >
      {error ? (
        <AlertTriangle className="size-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="size-3.5 shrink-0" />
      )}
      {error ?? success}
    </p>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Users;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass rounded-2xl border-border/60 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="font-display text-lg">{title}</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      data-ocid="admin.empty_state"
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 px-6 py-10 text-center"
    >
      <Layers className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingRows() {
  const ids = Array.from({ length: 4 }, (_, i) => `admin-skeleton-${i}`);
  return (
    <div data-ocid="admin.loading_state" className="space-y-2" aria-busy="true">
      {ids.map((id) => (
        <Skeleton key={id} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

function AnalyticsSection() {
  const { data, isLoading, isError } = useAdminAnalytics();

  const stats = useMemo(
    () => [
      {
        label: "Total students",
        value: data ? formatXp(data.totalStudents) : "—",
        icon: Users,
      },
      {
        label: "Active today",
        value: data ? formatXp(data.activeStudentsToday) : "—",
        icon: GraduationCap,
      },
      {
        label: "Study minutes",
        value: data ? formatMinutes(data.totalStudyMinutes) : "—",
        icon: BookOpen,
      },
      {
        label: "XP awarded",
        value: data ? formatXp(data.totalXpAwarded) : "—",
        icon: Target,
      },
      {
        label: "Purchases",
        value: data ? formatXp(data.totalPurchases) : "—",
        icon: ShoppingBag,
      },
      {
        label: "Active memberships",
        value: data ? formatXp(data.activeMemberships) : "—",
        icon: CheckCircle2,
      },
      {
        label: "Resources",
        value: data ? formatXp(data.totalResources) : "—",
        icon: Layers,
      },
      {
        label: "Quests",
        value: data ? formatXp(data.totalQuests) : "—",
        icon: Target,
      },
    ],
    [data],
  );

  if (isLoading) {
    return (
      <div
        data-ocid="admin.analytics.loading_state"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        aria-busy="true"
      >
        {Array.from({ length: 8 }, (_, i) => `analytics-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-24 rounded-2xl" />
          ),
        )}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        data-ocid="admin.analytics.error_state"
        className="glass rounded-2xl p-6 text-sm text-destructive"
      >
        Could not load platform analytics. Please refresh and try again.
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.analytics.section"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          data-ocid={`admin.analytics.card.${stat.label.toLowerCase().replace(/\s+/g, "_")}`}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <stat.icon className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Students                                                            */
/* ------------------------------------------------------------------ */

function MembershipDialog({
  student,
  open,
  onOpenChange,
}: {
  student: StudentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setMembership = useAdminSetMembership();
  const [tier, setTier] = useState<PlanTier>(PlanTierEnum.moderate);
  const [days, setDays] = useState("30");

  const submit = () => {
    if (!student) return;
    const dayCount = Number.parseInt(days, 10);
    if (!Number.isFinite(dayCount) || dayCount <= 0) return;
    const expiresAt = BigInt(Date.now() + dayCount * 86_400_000) * 1_000_000n;
    setMembership.mutate(
      { student: student.id, tier, expiresAt },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="admin.membership.dialog">
        <DialogHeader>
          <DialogTitle>Set membership</DialogTitle>
          <DialogDescription>
            {student
              ? `Assign a plan to ${student.displayName}.`
              : "Assign a plan."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membership-tier">Plan tier</Label>
            <Select
              value={tier}
              onValueChange={(value) => setTier(value as PlanTier)}
            >
              <SelectTrigger
                id="membership-tier"
                data-ocid="admin.membership.tier.select"
              >
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="membership-days">Duration (days)</Label>
            <Input
              id="membership-days"
              data-ocid="admin.membership.days.input"
              type="number"
              min={1}
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          </div>
          <Feedback
            error={
              setMembership.isError ? "Could not update membership." : null
            }
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            data-ocid="admin.membership.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            data-ocid="admin.membership.submit_button"
            disabled={setMembership.isPending}
            onClick={submit}
          >
            {setMembership.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Save membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentsSection() {
  const { data, isLoading, isError } = useAdminStudents();
  const removeStudent = useAdminRemoveStudent();
  const flagStudent = useAdminFlagStudent();
  const clearFlag = useAdminClearStudentFlag();
  const [membershipTarget, setMembershipTarget] =
    useState<StudentSummary | null>(null);

  return (
    <SectionCard
      title="Students"
      description="Review enrolled students, manage memberships and moderate accounts."
      icon={Users}
    >
      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p
          data-ocid="admin.students.error_state"
          className="text-sm text-destructive"
        >
          Could not load students.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState message="No students have joined yet." />
      ) : (
        <div className="overflow-x-auto">
          <Table data-ocid="admin.students.table">
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((student, index) => (
                <TableRow
                  key={student.id.toText()}
                  data-ocid={`admin.students.row.${index + 1}`}
                >
                  <TableCell className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {student.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{student.username}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {student.level.toString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatXp(student.xp)}
                  </TableCell>
                  <TableCell>
                    {student.membershipTier ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full capitalize"
                      >
                        {student.membershipTier}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Free
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(student.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        data-ocid={`admin.students.membership_button.${index + 1}`}
                        onClick={() => setMembershipTarget(student)}
                      >
                        Membership
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Flag ${student.displayName}`}
                        data-ocid={`admin.students.flag_button.${index + 1}`}
                        disabled={flagStudent.isPending}
                        onClick={() => flagStudent.mutate(student.id)}
                      >
                        <Flag className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Clear flag for ${student.displayName}`}
                        data-ocid={`admin.students.clear_flag_button.${index + 1}`}
                        disabled={clearFlag.isPending}
                        onClick={() => clearFlag.mutate(student.id)}
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${student.displayName}`}
                        data-ocid={`admin.students.remove_button.${index + 1}`}
                        disabled={removeStudent.isPending}
                        onClick={() => removeStudent.mutate(student.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <MembershipDialog
        student={membershipTarget}
        open={membershipTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMembershipTarget(null);
        }}
      />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Quests                                                              */
/* ------------------------------------------------------------------ */

function QuestDialog({
  quest,
  open,
  onOpenChange,
}: {
  quest: QuestView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createQuest = useAdminCreateQuest();
  const updateQuest = useAdminUpdateQuest();
  const editing = quest !== null;
  const [title, setTitle] = useState(quest?.quest.title ?? "");
  const [description, setDescription] = useState(
    quest?.quest.description ?? "",
  );
  const [goalKind, setGoalKind] = useState<QuestGoal["__kind__"]>(
    quest?.quest.goal.__kind__ ?? "studyMinutes",
  );
  const [amount, setAmount] = useState(
    String(quest ? goalAmount(quest.quest.goal) : 30),
  );
  const [xpReward, setXpReward] = useState(
    String(quest ? Number(quest.quest.xpReward) : 20),
  );
  const [active, setActive] = useState(quest?.quest.active ?? true);

  const pending = createQuest.isPending || updateQuest.isPending;
  const error = createQuest.isError || updateQuest.isError;

  const submit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const goal = buildGoal(goalKind, Number.parseInt(amount, 10));
    const xp = BigInt(Math.max(0, Number.parseInt(xpReward, 10) || 0));
    if (editing && quest) {
      updateQuest.mutate(
        {
          questId: quest.quest.id,
          title: trimmedTitle,
          description: description.trim(),
          goal,
          xpReward: xp,
          active,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createQuest.mutate(
        {
          title: trimmedTitle,
          description: description.trim(),
          goal,
          xpReward: xp,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="admin.quest.dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Edit quest" : "Create quest"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this daily quest."
              : "Add a new daily quest for students."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quest-title">Title</Label>
            <Input
              id="quest-title"
              data-ocid="admin.quest.title.input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Study for 30 minutes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quest-description">Description</Label>
            <Textarea
              id="quest-description"
              data-ocid="admin.quest.description.textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what the student must do."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quest-goal">Goal type</Label>
              <Select
                value={goalKind}
                onValueChange={(value) =>
                  setGoalKind(value as QuestGoal["__kind__"])
                }
              >
                <SelectTrigger
                  id="quest-goal"
                  data-ocid="admin.quest.goal.select"
                >
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {QUEST_GOAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {goalNeedsAmount(goalKind) && (
              <div className="space-y-2">
                <Label htmlFor="quest-amount">Target amount</Label>
                <Input
                  id="quest-amount"
                  data-ocid="admin.quest.amount.input"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quest-xp">XP reward</Label>
              <Input
                id="quest-xp"
                data-ocid="admin.quest.xp.input"
                type="number"
                min={0}
                value={xpReward}
                onChange={(event) => setXpReward(event.target.value)}
              />
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <Label htmlFor="quest-active">Active</Label>
                <Switch
                  id="quest-active"
                  data-ocid="admin.quest.active.switch"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>
            )}
          </div>
          <Feedback error={error ? "Could not save the quest." : null} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            data-ocid="admin.quest.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            data-ocid="admin.quest.submit_button"
            disabled={pending || title.trim().length === 0}
            onClick={submit}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save quest" : "Create quest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestsSection() {
  const { data, isLoading, isError } = useDailyQuests();
  const deleteQuest = useAdminDeleteQuest();
  const [dialogQuest, setDialogQuest] = useState<QuestView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => {
    setDialogQuest(null);
    setDialogOpen(true);
  };
  const openEdit = (quest: QuestView) => {
    setDialogQuest(quest);
    setDialogOpen(true);
  };

  return (
    <SectionCard
      title="Daily quests"
      description="Create, edit and retire the quests students complete each day."
      icon={Target}
      action={
        <Button
          type="button"
          className="rounded-xl"
          data-ocid="admin.quest.open_modal_button"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          New quest
        </Button>
      }
    >
      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p
          data-ocid="admin.quests.error_state"
          className="text-sm text-destructive"
        >
          Could not load quests.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState message="No quests yet. Create the first daily quest." />
      ) : (
        <ul className="space-y-2">
          {data.map((quest, index) => (
            <li
              key={quest.quest.id.toString()}
              data-ocid={`admin.quests.item.${index + 1}`}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">
                    {quest.quest.title}
                  </p>
                  {!quest.quest.active && (
                    <Badge variant="outline" className="rounded-full">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {quest.quest.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {goalLabel(quest.quest.goal)} ·{" "}
                  {formatXp(quest.quest.xpReward)} XP
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${quest.quest.title}`}
                  data-ocid={`admin.quests.edit_button.${index + 1}`}
                  onClick={() => openEdit(quest)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${quest.quest.title}`}
                  data-ocid={`admin.quests.delete_button.${index + 1}`}
                  disabled={deleteQuest.isPending}
                  onClick={() => deleteQuest.mutate(quest.quest.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <QuestDialog
        quest={dialogQuest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Store items                                                         */
/* ------------------------------------------------------------------ */

function StoreItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item: StoreItemView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createItem = useAdminCreateStoreItem();
  const updateItem = useAdminUpdateStoreItem();
  const editing = item !== null;
  const [name, setName] = useState(item?.item.name ?? "");
  const [description, setDescription] = useState(item?.item.description ?? "");
  const [kind, setKind] = useState<StoreItemKind>(
    item?.item.kind ?? StoreItemKindEnum.avatar,
  );
  const [xpPrice, setXpPrice] = useState(
    String(item ? Number(item.item.xpPrice) : 100),
  );
  const [active, setActive] = useState(item?.item.active ?? true);

  const pending = createItem.isPending || updateItem.isPending;
  const error = createItem.isError || updateItem.isError;

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const price = BigInt(Math.max(0, Number.parseInt(xpPrice, 10) || 0));
    if (editing && item) {
      updateItem.mutate(
        {
          itemId: item.item.id,
          name: trimmedName,
          description: description.trim(),
          kind,
          xpPrice: price,
          active,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createItem.mutate(
        {
          name: trimmedName,
          description: description.trim(),
          kind,
          xpPrice: price,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="admin.store.dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit store item" : "Create store item"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this XP store product."
              : "Add a new product to the XP store."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Name</Label>
            <Input
              id="store-name"
              data-ocid="admin.store.name.input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Neon avatar frame"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-description">Description</Label>
            <Textarea
              id="store-description"
              data-ocid="admin.store.description.textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the reward."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-kind">Kind</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as StoreItemKind)}
              >
                <SelectTrigger
                  id="store-kind"
                  data-ocid="admin.store.kind.select"
                >
                  <SelectValue placeholder="Select a kind" />
                </SelectTrigger>
                <SelectContent>
                  {STORE_KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-price">XP price</Label>
              <Input
                id="store-price"
                data-ocid="admin.store.price.input"
                type="number"
                min={0}
                value={xpPrice}
                onChange={(event) => setXpPrice(event.target.value)}
              />
            </div>
          </div>
          {editing && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
              <Label htmlFor="store-active">Active</Label>
              <Switch
                id="store-active"
                data-ocid="admin.store.active.switch"
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
          )}
          <Feedback error={error ? "Could not save the store item." : null} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            data-ocid="admin.store.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            data-ocid="admin.store.submit_button"
            disabled={pending || name.trim().length === 0}
            onClick={submit}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save item" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StoreSection() {
  const { data, isLoading, isError } = useStoreItems();
  const deleteItem = useAdminDeleteStoreItem();
  const [dialogItem, setDialogItem] = useState<StoreItemView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SectionCard
      title="XP store products"
      description="Manage the rewards students can buy with their XP."
      icon={ShoppingBag}
      action={
        <Button
          type="button"
          className="rounded-xl"
          data-ocid="admin.store.open_modal_button"
          onClick={() => {
            setDialogItem(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New item
        </Button>
      }
    >
      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p
          data-ocid="admin.store.error_state"
          className="text-sm text-destructive"
        >
          Could not load store items.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState message="No store items yet. Add the first reward." />
      ) : (
        <ul className="space-y-2">
          {data.map((item, index) => (
            <li
              key={item.item.id.toString()}
              data-ocid={`admin.store.item.${index + 1}`}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">
                    {item.item.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="rounded-full capitalize"
                  >
                    {item.item.kind}
                  </Badge>
                  {!item.item.active && (
                    <Badge variant="outline" className="rounded-full">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {item.item.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatXp(item.item.xpPrice)} XP
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${item.item.name}`}
                  data-ocid={`admin.store.edit_button.${index + 1}`}
                  onClick={() => {
                    setDialogItem(item);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${item.item.name}`}
                  data-ocid={`admin.store.delete_button.${index + 1}`}
                  disabled={deleteItem.isPending}
                  onClick={() => deleteItem.mutate(item.item.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <StoreItemDialog
        item={dialogItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

function ThemeDialog({
  theme,
  open,
  onOpenChange,
}: {
  theme: ThemeView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createTheme = useAdminCreateTheme();
  const updateTheme = useAdminUpdateTheme();
  const editing = theme !== null;
  const [name, setName] = useState(theme?.theme.name ?? "");
  const [description, setDescription] = useState(
    theme?.theme.description ?? "",
  );
  const [premium, setPremium] = useState(theme?.theme.premium ?? false);
  const [cssVariables, setCssVariables] = useState(
    theme?.theme.cssVariables ?? "",
  );

  const pending = createTheme.isPending || updateTheme.isPending;
  const error = createTheme.isError || updateTheme.isError;

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (editing && theme) {
      updateTheme.mutate(
        {
          themeId: theme.theme.id,
          name: trimmedName,
          description: description.trim(),
          premium,
          cssVariables: cssVariables.trim(),
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createTheme.mutate(
        {
          name: trimmedName,
          description: description.trim(),
          premium,
          cssVariables: cssVariables.trim(),
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="admin.theme.dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Edit theme" : "Create theme"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this dashboard theme."
              : "Add a new dashboard theme."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-name">Name</Label>
            <Input
              id="theme-name"
              data-ocid="admin.theme.name.input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Violet Galaxy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-description">Description</Label>
            <Textarea
              id="theme-description"
              data-ocid="admin.theme.description.textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the theme."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-css">CSS variables</Label>
            <Textarea
              id="theme-css"
              data-ocid="admin.theme.css.textarea"
              value={cssVariables}
              onChange={(event) => setCssVariables(event.target.value)}
              placeholder="--primary: 0.62 0.24 300;"
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
            <Label htmlFor="theme-premium">Premium (Ultimate only)</Label>
            <Switch
              id="theme-premium"
              data-ocid="admin.theme.premium.switch"
              checked={premium}
              onCheckedChange={setPremium}
            />
          </div>
          <Feedback error={error ? "Could not save the theme." : null} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            data-ocid="admin.theme.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            data-ocid="admin.theme.submit_button"
            disabled={pending || name.trim().length === 0}
            onClick={submit}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save theme" : "Create theme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThemesSection() {
  const { data, isLoading, isError } = useThemes();
  const deleteTheme = useAdminDeleteTheme();
  const [dialogTheme, setDialogTheme] = useState<ThemeView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SectionCard
      title="Themes"
      description="Curate the dashboard themes students can unlock and apply."
      icon={Palette}
      action={
        <Button
          type="button"
          className="rounded-xl"
          data-ocid="admin.theme.open_modal_button"
          onClick={() => {
            setDialogTheme(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New theme
        </Button>
      }
    >
      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p
          data-ocid="admin.themes.error_state"
          className="text-sm text-destructive"
        >
          Could not load themes.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState message="No themes yet. Add the first dashboard theme." />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.map((theme, index) => (
            <li
              key={theme.theme.id.toString()}
              data-ocid={`admin.themes.item.${index + 1}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">
                    {theme.theme.name}
                  </p>
                  {theme.theme.premium && (
                    <Badge variant="secondary" className="rounded-full">
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {theme.theme.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${theme.theme.name}`}
                  data-ocid={`admin.themes.edit_button.${index + 1}`}
                  onClick={() => {
                    setDialogTheme(theme);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${theme.theme.name}`}
                  data-ocid={`admin.themes.delete_button.${index + 1}`}
                  disabled={deleteTheme.isPending}
                  onClick={() => deleteTheme.mutate(theme.theme.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ThemeDialog
        theme={dialogTheme}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

function ResourceDialog({
  resource,
  open,
  onOpenChange,
}: {
  resource: ResourceView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createResource = useAdminCreateResource();
  const updateResource = useAdminUpdateResource();
  const editing = resource !== null;
  const [title, setTitle] = useState(resource?.title ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [category, setCategory] = useState(resource?.category ?? "");
  const [subject, setSubject] = useState(resource?.subject ?? "");
  const [classLevel, setClassLevel] = useState(resource?.classLevel ?? "");
  const [board, setBoard] = useState(resource?.board ?? "");
  const [file, setFile] = useState<File | null>(null);

  const pending = createResource.isPending || updateResource.isPending;
  const error = createResource.isError || updateResource.isError;

  const submit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    if (editing && resource) {
      updateResource.mutate(
        {
          resourceId: resource.id,
          title: trimmedTitle,
          description: description.trim(),
          category: category.trim(),
          subject: subject.trim(),
          classLevel: classLevel.trim(),
          board: board.trim(),
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    createResource.mutate(
      {
        title: trimmedTitle,
        description: description.trim(),
        category: category.trim(),
        subject: subject.trim(),
        classLevel: classLevel.trim(),
        board: board.trim(),
        file: bytes,
        fileName: file.name,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="admin.resource.dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit resource" : "Upload resource"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this library resource."
              : "Add a study material or PDF to the library."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              data-ocid="admin.resource.title.input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Class 10 Physics Notes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-description">Description</Label>
            <Textarea
              id="resource-description"
              data-ocid="admin.resource.description.textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the resource."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resource-category">Category</Label>
              <Input
                id="resource-category"
                data-ocid="admin.resource.category.input"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Notes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-subject">Subject</Label>
              <Input
                id="resource-subject"
                data-ocid="admin.resource.subject.input"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Physics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-class">Class level</Label>
              <Input
                id="resource-class"
                data-ocid="admin.resource.class.input"
                value={classLevel}
                onChange={(event) => setClassLevel(event.target.value)}
                placeholder="Class 10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-board">Board</Label>
              <Input
                id="resource-board"
                data-ocid="admin.resource.board.input"
                value={board}
                onChange={(event) => setBoard(event.target.value)}
                placeholder="CBSE"
              />
            </div>
          </div>
          {!editing && (
            <div className="space-y-2">
              <Label htmlFor="resource-file">File</Label>
              <label
                htmlFor="resource-file"
                data-ocid="admin.resource.dropzone"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground transition-smooth hover:border-primary/60 hover:text-foreground"
              >
                <Upload className="size-4" />
                <span className="min-w-0 truncate">
                  {file ? file.name : "Choose a PDF or document"}
                </span>
              </label>
              <input
                id="resource-file"
                data-ocid="admin.resource.file.input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          )}
          <Feedback error={error ? "Could not save the resource." : null} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            data-ocid="admin.resource.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            data-ocid="admin.resource.submit_button"
            disabled={
              pending || title.trim().length === 0 || (!editing && !file)
            }
            onClick={() => void submit()}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save resource" : "Upload resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResourcesSection() {
  const { data, isLoading, isError } = useSearchResources({});
  const deleteResource = useAdminDeleteResource();
  const [dialogResource, setDialogResource] = useState<ResourceView | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SectionCard
      title="Study materials"
      description="Upload PDFs and documents, and manage the study library."
      icon={BookOpen}
      action={
        <Button
          type="button"
          className="rounded-xl"
          data-ocid="admin.resource.open_modal_button"
          onClick={() => {
            setDialogResource(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Upload resource
        </Button>
      }
    >
      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p
          data-ocid="admin.resources.error_state"
          className="text-sm text-destructive"
        >
          Could not load resources.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState message="No resources yet. Upload the first study material." />
      ) : (
        <ul className="space-y-2">
          {data.map((resource, index) => (
            <li
              key={resource.id.toString()}
              data-ocid={`admin.resources.item.${index + 1}`}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {resource.title}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {resource.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    resource.category,
                    resource.subject,
                    resource.classLevel,
                    resource.board,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${resource.title}`}
                  data-ocid={`admin.resources.edit_button.${index + 1}`}
                  onClick={() => {
                    setDialogResource(resource);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${resource.title}`}
                  data-ocid={`admin.resources.delete_button.${index + 1}`}
                  disabled={deleteResource.isPending}
                  onClick={() => deleteResource.mutate(resource.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ResourceDialog
        resource={dialogResource}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Website links                                                       */
/* ------------------------------------------------------------------ */

function WebsiteLinksSection() {
  const { data, isLoading, isError } = useWebsiteLinks();
  const addLink = useAdminAddWebsiteLink();
  const removeLink = useAdminRemoveWebsiteLink();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) return;
    addLink.mutate(
      {
        name: trimmedName,
        description: description.trim(),
        url: trimmedUrl,
        category: category.trim(),
      },
      {
        onSuccess: () => {
          setName("");
          setUrl("");
          setCategory("");
          setDescription("");
        },
      },
    );
  };

  return (
    <SectionCard
      title="Website hub links"
      description="Add and remove the educational sites students can open."
      icon={Globe}
    >
      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="link-name">Name</Label>
            <Input
              id="link-name"
              data-ocid="admin.links.name.input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Khan Academy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              data-ocid="admin.links.url.input"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.khanacademy.org"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-category">Category</Label>
            <Input
              id="link-category"
              data-ocid="admin.links.category.input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Practice"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-description">Description</Label>
            <Input
              id="link-description"
              data-ocid="admin.links.description.input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Free practice exercises"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Feedback
            error={addLink.isError ? "Could not add the link." : null}
          />
          <Button
            type="button"
            className="rounded-xl"
            data-ocid="admin.links.add_button"
            disabled={
              addLink.isPending ||
              name.trim().length === 0 ||
              url.trim().length === 0
            }
            onClick={submit}
          >
            {addLink.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add link
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingRows />
        ) : isError ? (
          <p
            data-ocid="admin.links.error_state"
            className="text-sm text-destructive"
          >
            Could not load website links.
          </p>
        ) : !data || data.length === 0 ? (
          <EmptyState message="No website links yet. Add the first one above." />
        ) : (
          <ul className="space-y-2">
            {data.map((link: WebsiteLink, index) => (
              <li
                key={link.id.toString()}
                data-ocid={`admin.links.item.${index + 1}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {link.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {link.url}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${link.name}`}
                  data-ocid={`admin.links.remove_button.${index + 1}`}
                  disabled={removeLink.isPending}
                  onClick={() => removeLink.mutate(link.id)}
                >
                  <X className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Leaderboard moderation                                              */
/* ------------------------------------------------------------------ */

function LeaderboardModerationSection() {
  const { data, isLoading, isError } = useLeaderboard(
    LeaderboardScope.global,
    100n,
  );
  const flagStudent = useAdminFlagStudent();
  const clearFlag = useAdminClearStudentFlag();

  return (
    <SectionCard
      title="Leaderboard moderation"
      description="Flag or clear students directly from the global leaderboard."
      icon={Flag}
    >
      {isLoading ? (
        <LoadingRows />
      ) : isError ? (
        <p
          data-ocid="admin.leaderboard.error_state"
          className="text-sm text-destructive"
        >
          Could not load the leaderboard.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState message="The leaderboard is empty right now." />
      ) : (
        <div className="overflow-x-auto">
          <Table data-ocid="admin.leaderboard.table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-right">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead className="text-right">Moderation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry: LeaderboardEntry, index) => (
                <TableRow
                  key={entry.student.toText()}
                  data-ocid={`admin.leaderboard.row.${index + 1}`}
                >
                  <TableCell className="text-right tabular-nums">
                    {entry.rank.toString()}
                  </TableCell>
                  <TableCell className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {entry.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{entry.username}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.level.toString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatXp(entry.xp)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        data-ocid={`admin.leaderboard.flag_button.${index + 1}`}
                        disabled={flagStudent.isPending}
                        onClick={() => flagStudent.mutate(entry.student)}
                      >
                        <Flag className="size-4" />
                        Flag
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        data-ocid={`admin.leaderboard.clear_flag_button.${index + 1}`}
                        disabled={clearFlag.isPending}
                        onClick={() => clearFlag.mutate(entry.student)}
                      >
                        <CheckCircle2 className="size-4" />
                        Clear
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  return (
    <div data-ocid="admin.page" className="space-y-6">
      <PageHeader
        eyebrow="Control room"
        title="Admin dashboard"
        description="Manage students, study materials, quests, store products, themes, memberships and leaderboard moderation."
      />

      <AnalyticsSection />

      <Tabs defaultValue="students" data-ocid="admin.tabs">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/50 p-1">
          <TabsTrigger
            value="students"
            data-ocid="admin.students.tab"
            className="rounded-xl"
          >
            <Users className="size-4" />
            Students
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            data-ocid="admin.resources.tab"
            className="rounded-xl"
          >
            <BookOpen className="size-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger
            value="quests"
            data-ocid="admin.quests.tab"
            className="rounded-xl"
          >
            <Target className="size-4" />
            Quests
          </TabsTrigger>
          <TabsTrigger
            value="store"
            data-ocid="admin.store.tab"
            className="rounded-xl"
          >
            <ShoppingBag className="size-4" />
            Store
          </TabsTrigger>
          <TabsTrigger
            value="themes"
            data-ocid="admin.themes.tab"
            className="rounded-xl"
          >
            <Palette className="size-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger
            value="links"
            data-ocid="admin.links.tab"
            className="rounded-xl"
          >
            <Globe className="size-4" />
            Website hub
          </TabsTrigger>
          <TabsTrigger
            value="moderation"
            data-ocid="admin.moderation.tab"
            className="rounded-xl"
          >
            <Flag className="size-4" />
            Moderation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <StudentsSection />
        </TabsContent>
        <TabsContent value="resources" className="mt-4">
          <ResourcesSection />
        </TabsContent>
        <TabsContent value="quests" className="mt-4">
          <QuestsSection />
        </TabsContent>
        <TabsContent value="store" className="mt-4">
          <StoreSection />
        </TabsContent>
        <TabsContent value="themes" className="mt-4">
          <ThemesSection />
        </TabsContent>
        <TabsContent value="links" className="mt-4">
          <WebsiteLinksSection />
        </TabsContent>
        <TabsContent value="moderation" className="mt-4">
          <LeaderboardModerationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
