import { PlanTier } from "@/backend";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBeginMembershipPurchase,
  useMembership,
  useMembershipPlans,
  useVerifyMembershipPayment,
} from "@/hooks/useQueries";
import { formatDate, formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MembershipView, Plan, Subscription } from "@/types";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Clock,
  Crown,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";

/** Visual identity per tier, keyed by the backend PlanTier value. */
const TIER_STYLE: Record<
  PlanTier,
  {
    icon: typeof Crown;
    accent: string;
    ring: string;
    glow: string;
    tagline: string;
    featured?: boolean;
  }
> = {
  [PlanTier.moderate]: {
    icon: Zap,
    accent: "from-violet-500 to-indigo-500",
    ring: "border-border",
    glow: "shadow-glass",
    tagline: "Warm up your grind",
  },
  [PlanTier.advanced]: {
    icon: Rocket,
    accent: "from-indigo-500 to-blue-500",
    ring: "border-primary/50",
    glow: "glow-ring",
    tagline: "Most popular boost",
    featured: true,
  },
  [PlanTier.ultimate]: {
    icon: Crown,
    accent: "from-fuchsia-500 via-violet-500 to-indigo-500",
    ring: "border-fuchsia-400/50",
    glow: "glow-ring",
    tagline: "Everything, unlocked",
  },
};

function tierStyle(tier: PlanTier) {
  return TIER_STYLE[tier] ?? TIER_STYLE[PlanTier.moderate];
}

/** Human label for a plan tier, e.g. "moderate" -> "Moderate". */
function tierLabel(tier: PlanTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/** A single pricing card for one membership plan. */
function PlanCard({
  plan,
  index,
  isCurrent,
  pendingTier,
  onSelect,
}: {
  plan: Plan;
  index: number;
  isCurrent: boolean;
  pendingTier: PlanTier | undefined;
  onSelect: (plan: Plan) => void;
}) {
  const style = tierStyle(plan.tier);
  const Icon = style.icon;
  const isPending = pendingTier === plan.tier;

  return (
    <Card
      data-ocid={`membership.plan_card.${index + 1}`}
      className={cn(
        "glass relative flex flex-col overflow-hidden rounded-2xl transition-smooth hover:-translate-y-1",
        style.ring,
        style.glow,
        style.featured && "lg:-translate-y-2 lg:hover:-translate-y-3",
      )}
    >
      {style.featured && (
        <div className="absolute right-4 top-4">
          <Badge className="bg-gradient-primary text-primary-foreground">
            <Sparkles className="size-3" />
            Popular
          </Badge>
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-glass",
              style.accent,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
              {plan.name || tierLabel(plan.tier)}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {style.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <span className="font-display text-4xl font-bold tracking-tight text-foreground">
            {formatRupees(plan.priceRupees)}
          </span>
          <span className="pb-1 text-sm text-muted-foreground">/ month</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
          <Zap className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {plan.xpMultiplier.toString()}X XP multiplier
          </span>
        </div>

        <ul className="flex flex-1 flex-col gap-2.5">
          {plan.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          data-ocid={`membership.select_button.${index + 1}`}
          disabled={isCurrent || isPending}
          onClick={() => onSelect(plan)}
          className={cn(
            "h-11 w-full rounded-xl text-sm font-semibold transition-smooth",
            style.featured
              ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Starting…
            </>
          ) : isCurrent ? (
            <>
              <BadgeCheck className="size-4" />
              Current plan
            </>
          ) : (
            <>
              Choose {tierLabel(plan.tier)}
              <Zap className="size-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Loading skeleton matching the three-card grid. */
function PlansSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => `plan-skeleton-${i}`).map((id) => (
        <Card key={id} className="glass rounded-2xl border-border shadow-glass">
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Current membership status banner. */
function StatusPanel({
  membership,
  isLoading,
  isError,
  onRetry,
}: {
  membership: MembershipView | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <Card
        data-ocid="membership.status.loading_state"
        className="glass rounded-2xl border-border shadow-glass"
      >
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card
        data-ocid="membership.status.error_state"
        className="glass rounded-2xl border-destructive/40 shadow-glass"
      >
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold text-foreground">
                Couldn't load your membership
              </p>
              <p className="text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            data-ocid="membership.status.retry_button"
            onClick={onRetry}
            className="rounded-xl"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const active = membership?.active ?? false;
  const tier = membership?.tier;

  return (
    <Card
      data-ocid="membership.status.panel"
      className={cn(
        "glass overflow-hidden rounded-2xl shadow-glass",
        active ? "border-primary/40" : "border-border",
      )}
    >
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl shadow-glass",
              active
                ? "bg-gradient-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {active ? (
              <Crown className="size-6" />
            ) : (
              <ShieldCheck className="size-6" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-bold text-foreground">
                {active && tier ? `${tierLabel(tier)} member` : "Free plan"}
              </p>
              {active ? (
                <Badge className="bg-success/15 text-success">
                  <BadgeCheck className="size-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">No active benefits</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {active && tier
                ? `${membership?.xpMultiplier.toString() ?? "1"}X XP on every verified session`
                : "Upgrade to multiply the XP you earn from verified study sessions."}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-secondary/60 px-4 py-3 text-left sm:text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {active ? "Expires" : "Status"}
          </p>
          <p className="font-display text-base font-semibold text-foreground">
            {active ? formatDate(membership?.expiresAt) : "Inactive"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Pending-payment verification panel shown after a purchase is started. */
function PendingPanel({
  subscription,
  onVerified,
}: {
  subscription: Subscription;
  onVerified: () => void;
}) {
  const [reference, setReference] = useState(
    subscription.paymentReference ?? "",
  );
  const verify = useVerifyMembershipPayment();

  const handleVerify = () => {
    const trimmed = reference.trim();
    if (!trimmed) return;
    verify.mutate(trimmed, { onSuccess: () => onVerified() });
  };

  return (
    <Card
      data-ocid="membership.pending.panel"
      className="glass animate-fade-up rounded-2xl border-warning/40 shadow-glass"
    >
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <Clock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-foreground">
              Payment pending verification
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {tierLabel(subscription.tier)} membership is reserved, but
              benefits stay locked until the payment is verified. Enter the
              payment reference below to confirm it.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-payment-reference">
            Payment reference
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="membership-payment-reference"
              data-ocid="membership.pending.input"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. UPI-4821-9930"
              className="rounded-xl"
              autoComplete="off"
            />
            <Button
              type="button"
              data-ocid="membership.pending.verify_button"
              onClick={handleVerify}
              disabled={verify.isPending || reference.trim().length === 0}
              className="h-10 shrink-0 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {verify.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Verify payment
                </>
              )}
            </Button>
          </div>
        </div>

        {verify.isError && (
          <p
            data-ocid="membership.pending.error_state"
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            We couldn't verify that reference. Double-check it and try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MembershipPage() {
  const plansQuery = useMembershipPlans();
  const membershipQuery = useMembership();
  const beginPurchase = useBeginMembershipPurchase();

  const [pending, setPending] = useState<Subscription | null>(null);
  const [selectedTier, setSelectedTier] = useState<PlanTier | undefined>();

  const plans = plansQuery.data ?? [];
  const membership = membershipQuery.data;

  const handleSelect = (plan: Plan) => {
    setSelectedTier(plan.tier);
    const reference = `MEM-${plan.tier.toUpperCase()}-${Date.now()
      .toString(36)
      .toUpperCase()}`;
    beginPurchase.mutate(
      { tier: plan.tier, paymentReference: reference },
      {
        onSuccess: (subscription) => {
          setPending(subscription);
          setSelectedTier(undefined);
        },
        onError: () => setSelectedTier(undefined),
      },
    );
  };

  const handleVerified = () => {
    setPending(null);
    void membershipQuery.refetch();
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Boost your XP"
        title="Membership"
        description="Multiply the XP you earn from verified study sessions. Benefits activate only after your payment is verified."
      />

      <StatusPanel
        membership={membership}
        isLoading={membershipQuery.isLoading}
        isError={membershipQuery.isError}
        onRetry={() => void membershipQuery.refetch()}
      />

      {pending && (
        <PendingPanel subscription={pending} onVerified={handleVerified} />
      )}

      {beginPurchase.isError && !pending && (
        <p
          data-ocid="membership.purchase.error_state"
          className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          We couldn't start that purchase. Please try again.
        </p>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Choose your plan
          </h2>
        </div>

        {plansQuery.isLoading ? (
          <PlansSkeleton />
        ) : plansQuery.isError ? (
          <Card
            data-ocid="membership.plans.error_state"
            className="glass rounded-2xl border-destructive/40 shadow-glass"
          >
            <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                  <AlertCircle className="size-6" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Couldn't load membership plans
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please try again in a moment.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                data-ocid="membership.plans.retry_button"
                onClick={() => void plansQuery.refetch()}
                className="rounded-xl"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : plans.length === 0 ? (
          <Card
            data-ocid="membership.plans.empty_state"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Crown className="size-6" />
              </span>
              <p className="font-display text-base font-bold text-foreground">
                No plans available yet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Membership plans haven't been published. Check back soon to
                unlock XP multipliers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.tier}
                plan={plan}
                index={index}
                isCurrent={
                  membership?.active === true && membership.tier === plan.tier
                }
                pendingTier={selectedTier}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" />
        Payments are verified before any benefit is applied. A pending purchase
        never grants XP multipliers on its own.
      </p>
    </div>
  );
}
