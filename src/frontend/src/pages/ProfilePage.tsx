import type {
  Profile,
  StoreItem,
  StoreItemKind,
  StoreItemView,
} from "@/backend";
import { StoreItemKind as StoreItemKindEnum } from "@/backend";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCallerProfile,
  useCreateProfile,
  useMembership,
  usePurchaseHistory,
  useStoreItems,
  useThemes,
  useUpdateProfile,
} from "@/hooks/useQueries";
import {
  formatDate,
  formatDateTime,
  formatLevel,
  formatXp,
  initials,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
  Frame,
  Image as ImageIcon,
  Loader2,
  Package,
  Palette,
  Pencil,
  Receipt,
  Sparkles,
  UserRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";

const KIND_LABELS: Record<StoreItemKind, string> = {
  [StoreItemKindEnum.avatar]: "Avatar",
  [StoreItemKindEnum.frame]: "Profile frame",
  [StoreItemKindEnum.badge]: "Badge",
  [StoreItemKindEnum.dashboardTheme]: "Dashboard theme",
  [StoreItemKindEnum.resource]: "Resource",
  [StoreItemKindEnum.digitalReward]: "Digital reward",
};

const KIND_ICONS: Record<StoreItemKind, typeof Sparkles> = {
  [StoreItemKindEnum.avatar]: ImageIcon,
  [StoreItemKindEnum.frame]: Frame,
  [StoreItemKindEnum.badge]: BadgeCheck,
  [StoreItemKindEnum.dashboardTheme]: Palette,
  [StoreItemKindEnum.resource]: Package,
  [StoreItemKindEnum.digitalReward]: Sparkles,
};

function kindLabel(kind: StoreItemKind): string {
  return KIND_LABELS[kind] ?? "Item";
}

/** Resolve an owned item id to its catalogue entry. */
function findItem(
  items: StoreItem[] | undefined,
  id: bigint | undefined,
): StoreItem | undefined {
  if (id === undefined || !items) return undefined;
  return items.find((item) => item.id === id);
}

/* ------------------------------------------------------------------ */
/* Create profile (first visit)                                        */
/* ------------------------------------------------------------------ */

function CreateProfileCard() {
  const createProfile = useCreateProfile();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    displayName?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { username?: string; displayName?: string } = {};
    const trimmedUsername = username.trim();
    const trimmedName = displayName.trim();

    if (trimmedUsername.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      nextErrors.username =
        "Use only letters, numbers and underscores in your username.";
    }
    if (trimmedName.length < 2) {
      nextErrors.displayName = "Display name must be at least 2 characters.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createProfile.mutate({
      username: trimmedUsername,
      displayName: trimmedName,
    });
  }

  return (
    <Card
      data-ocid="profile.create.card"
      className="glass animate-fade-up rounded-2xl border-border shadow-glass"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <UserRound className="size-5" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">
              Create your profile
            </CardTitle>
            <CardDescription>
              Set up your student identity to start earning XP and leveling up.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              data-ocid="profile.username.input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="aarav_sharma"
              autoComplete="username"
              aria-invalid={!!errors.username}
              aria-describedby={
                errors.username ? "profile-username-error" : undefined
              }
            />
            {errors.username && (
              <p
                id="profile-username-error"
                data-ocid="profile.username.error_state"
                className="text-xs text-destructive"
              >
                {errors.username}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-display-name">Display name</Label>
            <Input
              id="profile-display-name"
              data-ocid="profile.display_name.input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Aarav Sharma"
              autoComplete="name"
              aria-invalid={!!errors.displayName}
              aria-describedby={
                errors.displayName ? "profile-display-name-error" : undefined
              }
            />
            {errors.displayName && (
              <p
                id="profile-display-name-error"
                data-ocid="profile.display_name.error_state"
                className="text-xs text-destructive"
              >
                {errors.displayName}
              </p>
            )}
          </div>

          {createProfile.isError && (
            <Alert variant="destructive" data-ocid="profile.create.error_state">
              <AlertCircle className="size-4" />
              <AlertTitle>Could not create your profile</AlertTitle>
              <AlertDescription>
                {createProfile.error instanceof Error
                  ? createProfile.error.message
                  : "Please try again in a moment."}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            data-ocid="profile.create.submit_button"
            disabled={createProfile.isPending}
            className="w-full rounded-full bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110 sm:w-auto"
          >
            {createProfile.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating profile…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Create profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Edit profile                                                        */
/* ------------------------------------------------------------------ */

function EditProfileCard({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [errors, setErrors] = useState<{ displayName?: string; bio?: string }>(
    {},
  );
  const [saved, setSaved] = useState(false);

  function startEditing() {
    setDisplayName(profile.displayName);
    setBio(profile.bio);
    setErrors({});
    setSaved(false);
    setEditing(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { displayName?: string; bio?: string } = {};
    const trimmedName = displayName.trim();
    const trimmedBio = bio.trim();

    if (trimmedName.length < 2) {
      nextErrors.displayName = "Display name must be at least 2 characters.";
    } else if (trimmedName.length > 40) {
      nextErrors.displayName = "Display name must be 40 characters or fewer.";
    }
    if (trimmedBio.length > 280) {
      nextErrors.bio = "Bio must be 280 characters or fewer.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateProfile.mutate(
      { displayName: trimmedName, bio: trimmedBio },
      {
        onSuccess: () => {
          setSaved(true);
          setEditing(false);
        },
      },
    );
  }

  return (
    <Card
      data-ocid="profile.edit.card"
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
              <Pencil className="size-5" />
            </span>
            <div>
              <CardTitle className="font-display text-lg">
                Edit profile
              </CardTitle>
              <CardDescription>
                Update how you appear across the leaderboard and dashboard.
              </CardDescription>
            </div>
          </div>
          {!editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="profile.edit_button"
              onClick={startEditing}
              className="rounded-full"
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {saved && !editing && (
          <Alert
            data-ocid="profile.edit.success_state"
            className="mb-5 border-success/40 bg-success/10 text-foreground"
          >
            <CheckCircle2 className="size-4 text-success" />
            <AlertTitle>Profile updated</AlertTitle>
            <AlertDescription>
              Your changes are saved and visible across the app.
            </AlertDescription>
          </Alert>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="edit-display-name">Display name</Label>
              <Input
                id="edit-display-name"
                data-ocid="profile.edit.display_name.input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-invalid={!!errors.displayName}
                aria-describedby={
                  errors.displayName ? "edit-display-name-error" : undefined
                }
              />
              {errors.displayName && (
                <p
                  id="edit-display-name-error"
                  data-ocid="profile.edit.display_name.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.displayName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-bio">Bio</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {bio.length}/280
                </span>
              </div>
              <Textarea
                id="edit-bio"
                data-ocid="profile.edit.bio.textarea"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell other students what you are studying and what drives you."
                rows={4}
                aria-invalid={!!errors.bio}
                aria-describedby={errors.bio ? "edit-bio-error" : undefined}
              />
              {errors.bio && (
                <p
                  id="edit-bio-error"
                  data-ocid="profile.edit.bio.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.bio}
                </p>
              )}
            </div>

            {updateProfile.isError && (
              <Alert variant="destructive" data-ocid="profile.edit.error_state">
                <AlertCircle className="size-4" />
                <AlertTitle>Could not save your changes</AlertTitle>
                <AlertDescription>
                  {updateProfile.error instanceof Error
                    ? updateProfile.error.message
                    : "Please try again in a moment."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                data-ocid="profile.edit.save_button"
                disabled={updateProfile.isPending}
                className="rounded-full bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Save changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                data-ocid="profile.edit.cancel_button"
                onClick={() => {
                  setEditing(false);
                  setErrors({});
                }}
                disabled={updateProfile.isPending}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Display name
              </p>
              <p className="text-sm text-foreground">{profile.displayName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Bio
              </p>
              <p className="text-sm text-foreground">
                {profile.bio.trim() || (
                  <span className="text-muted-foreground">
                    No bio yet — add one to introduce yourself.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar and frame                                                    */
/* ------------------------------------------------------------------ */

function AvatarFrameCard({
  profile,
  items,
}: {
  profile: Profile;
  items: StoreItem[] | undefined;
}) {
  const avatarItem = findItem(items, profile.avatarItemId);
  const frameItem = findItem(items, profile.frameItemId);
  const ownedAvatars = (items ?? []).filter(
    (item) => item.kind === StoreItemKindEnum.avatar,
  );
  const ownedFrames = (items ?? []).filter(
    (item) => item.kind === StoreItemKindEnum.frame,
  );

  return (
    <Card
      data-ocid="profile.appearance.card"
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <ImageIcon className="size-5" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">
              Avatar &amp; frame
            </CardTitle>
            <CardDescription>
              Your equipped look, drawn from the items you own.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-16 border-2 border-primary/40">
              <AvatarFallback className="bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                {initials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Equipped avatar
              </p>
              <p className="text-sm text-foreground">
                {avatarItem ? avatarItem.name : "Default initials"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-16 items-center justify-center rounded-2xl border-2 border-accent/40 bg-muted/40">
              <Frame className="size-6 text-accent" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Equipped frame
              </p>
              <p className="text-sm text-foreground">
                {frameItem ? frameItem.name : "No frame equipped"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Owned avatars
            </p>
            {ownedAvatars.length === 0 ? (
              <p className="text-sm text-muted-foreground">No avatars yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {ownedAvatars.map((item) => (
                  <li key={item.id.toString()}>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full",
                        item.id === profile.avatarItemId &&
                          "bg-gradient-primary text-primary-foreground",
                      )}
                    >
                      {item.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Owned frames
            </p>
            {ownedFrames.length === 0 ? (
              <p className="text-sm text-muted-foreground">No frames yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {ownedFrames.map((item) => (
                  <li key={item.id.toString()}>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full",
                        item.id === profile.frameItemId &&
                          "bg-gradient-primary text-primary-foreground",
                      )}
                    >
                      {item.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/store" data-ocid="profile.appearance.store.link">
            <Sparkles className="size-4" />
            Browse the XP store
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Owned items                                                         */
/* ------------------------------------------------------------------ */

function OwnedItemsCard({
  items,
}: {
  items: StoreItemView[] | undefined;
}) {
  const owned = (items ?? []).filter((entry) => entry.owned);

  return (
    <Card
      data-ocid="profile.owned.card"
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <Package className="size-5" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">
              Items you own
            </CardTitle>
            <CardDescription>
              Everything you have unlocked with your XP.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {owned.length === 0 ? (
          <div
            data-ocid="profile.owned.empty_state"
            className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6"
          >
            <Package className="size-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No items yet
              </p>
              <p className="text-sm text-muted-foreground">
                Earn XP by studying, then spend it in the store to unlock
                avatars, frames and themes.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/store" data-ocid="profile.owned.store.link">
                <Sparkles className="size-4" />
                Visit the XP store
              </Link>
            </Button>
          </div>
        ) : (
          <ul
            data-ocid="profile.owned.list"
            className="grid gap-3 sm:grid-cols-2"
          >
            {owned.map((entry, index) => {
              const item = entry.item;
              const Icon = KIND_ICONS[item.kind] ?? Sparkles;
              return (
                <li
                  key={item.id.toString()}
                  data-ocid={`profile.owned.item.${index + 1}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-3 transition-smooth hover:border-primary/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kindLabel(item.kind)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Purchase history                                                    */
/* ------------------------------------------------------------------ */

function PurchaseHistoryCard({
  purchases,
  items,
  isLoading,
  isError,
}: {
  purchases:
    | Array<{
        id: bigint;
        itemId: bigint;
        xpSpent: bigint;
        purchasedAt: bigint;
      }>
    | undefined;
  items: StoreItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card
      data-ocid="profile.purchases.card"
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <Receipt className="size-5" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">
              Purchase history
            </CardTitle>
            <CardDescription>
              Your recent XP store transactions, newest first.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            data-ocid="profile.purchases.loading_state"
            className="space-y-3"
          >
            {Array.from({ length: 3 }, (_, i) => `purchase-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-14 w-full rounded-xl" />
              ),
            )}
          </div>
        ) : isError ? (
          <Alert
            variant="destructive"
            data-ocid="profile.purchases.error_state"
          >
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load purchase history</AlertTitle>
            <AlertDescription>
              Please refresh the page to try again.
            </AlertDescription>
          </Alert>
        ) : !purchases || purchases.length === 0 ? (
          <div
            data-ocid="profile.purchases.empty_state"
            className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6"
          >
            <Receipt className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No purchases yet
            </p>
            <p className="text-sm text-muted-foreground">
              Items you buy with XP will appear here.
            </p>
          </div>
        ) : (
          <ul
            data-ocid="profile.purchases.list"
            className="divide-y divide-border"
          >
            {purchases.map((purchase, index) => {
              const item = findItem(items, purchase.itemId);
              return (
                <li
                  key={purchase.id.toString()}
                  data-ocid={`profile.purchases.item.${index + 1}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item ? item.name : `Item #${purchase.itemId.toString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(purchase.purchasedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-primary">
                    −{formatXp(purchase.xpSpent)} XP
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Applied theme                                                       */
/* ------------------------------------------------------------------ */

function AppliedThemeCard() {
  const { data: themes, isLoading, isError } = useThemes();
  const applied = themes?.find((entry) => entry.applied);

  return (
    <Card
      data-ocid="profile.theme.card"
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <Palette className="size-5" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">
              Applied theme
            </CardTitle>
            <CardDescription>
              The look currently reskinning your dashboard.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton
            data-ocid="profile.theme.loading_state"
            className="h-16 w-full rounded-xl"
          />
        ) : isError ? (
          <Alert variant="destructive" data-ocid="profile.theme.error_state">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load themes</AlertTitle>
            <AlertDescription>
              Please refresh the page to try again.
            </AlertDescription>
          </Alert>
        ) : applied ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {applied.theme.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {applied.theme.description}
              </p>
            </div>
            <Badge className="shrink-0 rounded-full bg-gradient-primary text-primary-foreground">
              Active
            </Badge>
          </div>
        ) : (
          <div
            data-ocid="profile.theme.empty_state"
            className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6"
          >
            <Palette className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Default theme in use
            </p>
            <p className="text-sm text-muted-foreground">
              Pick a theme to personalise your dashboard.
            </p>
          </div>
        )}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-4 rounded-full"
        >
          <Link to="/themes" data-ocid="profile.theme.manage.link">
            <Palette className="size-4" />
            Manage themes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Profile hero                                                        */
/* ------------------------------------------------------------------ */

function ProfileHero({
  profile,
  membership,
  items,
}: {
  profile: Profile;
  membership:
    | {
        active: boolean;
        expiresAt?: bigint;
        xpMultiplier: bigint;
        tier?: string;
      }
    | undefined;
  items: StoreItem[] | undefined;
}) {
  const avatarItem = findItem(items, profile.avatarItemId);
  const frameItem = findItem(items, profile.frameItemId);

  return (
    <Card
      data-ocid="profile.hero.card"
      className="glass animate-fade-up overflow-hidden rounded-2xl border-border shadow-glass"
    >
      <div className="h-24 bg-gradient-primary" />
      <CardContent className="-mt-12 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="size-24 border-4 border-card shadow-glass">
              <AvatarFallback className="bg-gradient-primary font-display text-2xl font-bold text-primary-foreground">
                {initials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pb-1">
              <h2 className="truncate font-display text-xl font-bold text-foreground">
                {profile.displayName}
              </h2>
              <p className="truncate font-mono text-sm text-muted-foreground">
                @{profile.username}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <Badge
              data-ocid="profile.level.badge"
              className="rounded-full bg-gradient-primary text-primary-foreground"
            >
              {formatLevel(profile.level)}
            </Badge>
            <Badge
              data-ocid="profile.xp.badge"
              variant="secondary"
              className="rounded-full font-mono"
            >
              {formatXp(profile.xp)} XP
            </Badge>
          </div>
        </div>

        <p className="text-sm text-foreground">
          {profile.bio.trim() || (
            <span className="text-muted-foreground">
              No bio yet — add one from the edit panel below.
            </span>
          )}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Joined
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(profile.createdAt)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Crown className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Membership
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {membership?.active && membership.tier
                ? `${membership.tier.charAt(0).toUpperCase()}${membership.tier.slice(1)}`
                : "Free plan"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                XP boost
              </span>
            </div>
            <p className="mt-1 font-mono text-sm font-medium text-foreground">
              {membership?.active
                ? `${Number(membership.xpMultiplier)}×`
                : "1×"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BadgeCheck className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Expires
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {membership?.active && membership.expiresAt
                ? formatDate(membership.expiresAt)
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon className="size-3.5" />
            {avatarItem ? avatarItem.name : "Default avatar"}
          </span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Frame className="size-3.5" />
            {frameItem ? frameItem.name : "No frame"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useCallerProfile();
  const { data: membership } = useMembership();
  const { data: storeItems } = useStoreItems();
  const {
    data: purchases,
    isLoading: purchasesLoading,
    isError: purchasesError,
  } = usePurchaseHistory();

  const catalogue = storeItems?.map((entry) => entry.item);

  return (
    <div data-ocid="profile.page" className="space-y-6">
      <PageHeader
        eyebrow="Your identity"
        title="Profile"
        description="Manage your display name, bio, avatar and frame, and review your progress."
      />

      {profileLoading ? (
        <div data-ocid="profile.loading_state" className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      ) : profileError ? (
        <Alert variant="destructive" data-ocid="profile.error_state">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load your profile</AlertTitle>
          <AlertDescription>
            Please refresh the page to try again.
          </AlertDescription>
        </Alert>
      ) : !profile ? (
        <CreateProfileCard />
      ) : (
        <div className="space-y-6">
          <ProfileHero
            profile={profile}
            membership={membership}
            items={catalogue}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <EditProfileCard profile={profile} />
            <AvatarFrameCard profile={profile} items={catalogue} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <OwnedItemsCard items={storeItems} />
            <PurchaseHistoryCard
              purchases={purchases}
              items={catalogue}
              isLoading={purchasesLoading}
              isError={purchasesError}
            />
          </div>

          <AppliedThemeCard />
        </div>
      )}
    </div>
  );
}
