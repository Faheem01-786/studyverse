import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCallerProfile,
  usePurchaseHistory,
  usePurchaseStoreItem,
  useStoreItems,
} from "@/hooks/useQueries";
import { formatDate, formatXp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Purchase, StoreItemKind, StoreItemView } from "@/types";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Coins,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  Package,
  Palette,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

/** Human label and icon for each store item kind. */
const KIND_META: Record<StoreItemKind, { label: string; icon: LucideIcon }> = {
  avatar: { label: "Avatar", icon: ImageIcon },
  frame: { label: "Profile Frame", icon: BadgeCheck },
  badge: { label: "Badge", icon: Tag },
  dashboardTheme: { label: "Dashboard Theme", icon: Palette },
  resource: { label: "Study Resource", icon: Package },
  digitalReward: { label: "Digital Reward", icon: Sparkles },
};

function kindMeta(kind: StoreItemKind) {
  return KIND_META[kind] ?? { label: "Reward", icon: Sparkles };
}

/** Extract a readable message from a backend trap or thrown error. */
function describeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/already own/i.test(raw)) return "You already own this item.";
  if (/not enough xp/i.test(raw)) return "Not enough XP for this purchase.";
  if (/not available/i.test(raw)) return "This item is no longer available.";
  if (/not found/i.test(raw)) return "This item could not be found.";
  if (/sign in|unauthorized/i.test(raw))
    return "Please sign in to purchase items.";
  return "Something went wrong while completing your purchase. Please try again.";
}

export default function StorePage() {
  const itemsQuery = useStoreItems();
  const historyQuery = usePurchaseHistory();
  const profileQuery = useCallerProfile();
  const purchase = usePurchaseStoreItem();

  const [pendingItem, setPendingItem] = useState<StoreItemView | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const items = itemsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const balance = profileQuery.data?.xp ?? 0n;

  /** Resolve a purchase's item name from the catalogue. */
  const itemNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const view of items) map.set(view.item.id.toString(), view.item.name);
    return map;
  }, [items]);

  const ownedCount = items.filter((view) => view.owned).length;

  function openConfirm(view: StoreItemView) {
    setSuccessMessage(null);
    setErrorMessage(null);
    setPendingItem(view);
  }

  function confirmPurchase() {
    if (!pendingItem) return;
    const view = pendingItem;
    setPendingItem(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    purchase.mutate(view.item.id, {
      onSuccess: () => {
        setSuccessMessage(
          `Purchased “${view.item.name}” for ${formatXp(view.item.xpPrice)} XP.`,
        );
      },
      onError: (error) => {
        setErrorMessage(describeError(error));
      },
    });
  }

  const isBalanceLoading = profileQuery.isLoading;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Spend your XP"
        title="XP Store"
        description="Trade earned XP for avatars, frames, badges and dashboard themes. Every purchase is confirmed before XP leaves your balance."
        actions={
          <div
            data-ocid="store.balance_panel"
            className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-glass"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Coins className="size-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Your balance
              </span>
              {isBalanceLoading ? (
                <Skeleton className="mt-0.5 h-5 w-20 rounded-md" />
              ) : (
                <span
                  data-ocid="store.balance"
                  className="font-mono text-lg font-bold text-foreground"
                >
                  {formatXp(balance)} XP
                </span>
              )}
            </div>
          </div>
        }
      />

      {successMessage && (
        <output
          data-ocid="store.success_state"
          className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          <p className="min-w-0">{successMessage}</p>
        </output>
      )}

      {errorMessage && (
        <div
          data-ocid="store.error_state"
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="min-w-0">{errorMessage}</p>
        </div>
      )}

      {/* Catalogue */}
      <section data-ocid="store.section" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Catalogue
          </h2>
          {!itemsQuery.isLoading && items.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              {ownedCount} of {items.length} owned
            </span>
          )}
        </div>

        {itemsQuery.isLoading ? (
          <div
            data-ocid="store.loading_state"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, i) => `store-skeleton-${i}`).map(
              (id) => (
                <Card
                  key={id}
                  className="glass rounded-2xl border-border shadow-glass"
                >
                  <CardContent className="space-y-3 py-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        ) : itemsQuery.isError ? (
          <Card
            data-ocid="store.error_state"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display font-semibold text-foreground">
                  We couldn't load the store
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your connection and try again.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                data-ocid="store.retry_button"
                onClick={() => void itemsQuery.refetch()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card
            data-ocid="store.empty_state"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                <ShoppingBag className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display font-semibold text-foreground">
                  The store is being stocked
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  New avatars, frames and themes will appear here soon. Keep
                  studying to grow your XP balance.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((view, index) => {
              const meta = kindMeta(view.item.kind);
              const Icon = meta.icon;
              const affordable = balance >= view.item.xpPrice;
              const disabled = view.owned || purchase.isPending;
              return (
                <Card
                  key={view.item.id.toString()}
                  data-ocid={`store.item.${index + 1}`}
                  className={cn(
                    "glass group relative flex flex-col overflow-hidden rounded-2xl border-border shadow-glass transition-smooth hover:-translate-y-0.5",
                    view.owned && "border-primary/40",
                  )}
                >
                  <CardContent className="flex flex-1 flex-col gap-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
                        <Icon className="size-5" />
                      </span>
                      {view.owned ? (
                        <Badge
                          data-ocid={`store.owned_badge.${index + 1}`}
                          className="gap-1 border-transparent bg-success/15 text-success"
                        >
                          <CheckCircle2 className="size-3" />
                          Owned
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          {meta.label}
                        </Badge>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate font-display text-base font-semibold text-foreground">
                        {view.item.name}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {view.item.description}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
                        <Coins className="size-4 text-primary" />
                        {formatXp(view.item.xpPrice)} XP
                      </span>
                      {view.owned ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Lock className="size-3.5" />
                          In your collection
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          data-ocid={`store.buy_button.${index + 1}`}
                          disabled={disabled}
                          onClick={() => openConfirm(view)}
                          className="rounded-full bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:opacity-90"
                        >
                          {affordable ? "Buy" : "Buy anyway"}
                        </Button>
                      )}
                    </div>

                    {!view.owned && !affordable && (
                      <p className="text-xs text-warning">
                        You need {formatXp(view.item.xpPrice - balance)} more
                        XP.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Purchase history */}
      <section data-ocid="store.history_section" className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Purchase history
          </h2>
        </div>

        {historyQuery.isLoading ? (
          <Card
            data-ocid="store.history_loading_state"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="space-y-3 py-2">
              {Array.from({ length: 3 }, (_, i) => `history-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-10 w-full rounded-lg" />
                ),
              )}
            </CardContent>
          </Card>
        ) : historyQuery.isError ? (
          <Card
            data-ocid="store.history_error_state"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="size-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                We couldn't load your purchase history.
              </p>
              <Button
                type="button"
                variant="outline"
                data-ocid="store.history_retry_button"
                onClick={() => void historyQuery.refetch()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card
            data-ocid="store.history_empty_state"
            className="glass rounded-2xl border-border shadow-glass"
          >
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <LayoutDashboard className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display font-semibold text-foreground">
                  No purchases yet
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Items you buy with XP will be listed here with the amount
                  spent and the date.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass overflow-hidden rounded-2xl border-border shadow-glass">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table
                  data-ocid="store.history_table"
                  className="w-full min-w-[32rem] text-sm"
                >
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Item
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold"
                      >
                        XP spent
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold"
                      >
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry: Purchase, index) => (
                      <tr
                        key={entry.id.toString()}
                        data-ocid={`store.history_row.${index + 1}`}
                        className="border-b border-border/60 last:border-0 transition-smooth hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {itemNameById.get(entry.itemId.toString()) ??
                            `Item #${entry.itemId.toString()}`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          {formatXp(entry.xpSpent)} XP
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatDate(entry.purchasedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Purchase confirmation */}
      <AlertDialog
        open={pendingItem !== null}
        onOpenChange={(open) => {
          if (!open) setPendingItem(null);
        }}
      >
        <AlertDialogContent className="glass rounded-2xl border-border shadow-glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Confirm purchase
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingItem
                ? `Spend ${formatXp(pendingItem.item.xpPrice)} XP on “${pendingItem.item.name}”? This can't be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingItem && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Balance after</span>
              <span className="font-mono font-semibold text-foreground">
                {formatXp(
                  balance > pendingItem.item.xpPrice
                    ? balance - pendingItem.item.xpPrice
                    : 0n,
                )}{" "}
                XP
              </span>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="store.cancel_button"
              className="rounded-full"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="store.confirm_button"
              onClick={confirmPurchase}
              className="rounded-full bg-gradient-primary text-primary-foreground shadow-glass hover:opacity-90"
            >
              Confirm purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
