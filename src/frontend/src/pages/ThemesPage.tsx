import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplyTheme, useMembership, useThemes } from "@/hooks/useQueries";
import { applyThemeVariables, clearThemeVariables } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ThemeView } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Crown,
  Eye,
  Lock,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** The CSS custom properties surfaced as a theme's colour preview. */
const PREVIEW_VARIABLES = [
  "--background",
  "--card",
  "--primary",
  "--accent",
  "--foreground",
] as const;

/** Parse a `--name: value;` payload into a property map. */
function parseVariables(cssVariables: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const declaration of cssVariables.split(";")) {
    const trimmed = declaration.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;
    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!name.startsWith("--") || !value) continue;
    result[name] = value;
  }
  return result;
}

/** Turn an OKLCH component triple (`0.62 0.24 300`) into a CSS colour. */
function toCssColor(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("oklch(") || trimmed.startsWith("#")) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 3) return null;
  return `oklch(${parts[0]} ${parts[1]} ${parts[2]})`;
}

/** A theme's palette as an ordered list of CSS colours for the preview strip. */
function themeSwatches(cssVariables: string): string[] {
  const variables = parseVariables(cssVariables);
  const swatches: string[] = [];
  for (const name of PREVIEW_VARIABLES) {
    const color = toCssColor(variables[name]);
    if (color) swatches.push(color);
  }
  return swatches;
}

function ThemeCard({
  view,
  isPreviewing,
  isApplying,
  onPreview,
  onStopPreview,
  onApply,
}: {
  view: ThemeView;
  isPreviewing: boolean;
  isApplying: boolean;
  onPreview: () => void;
  onStopPreview: () => void;
  onApply: () => void;
}) {
  const { theme, applied, unlocked } = view;
  const swatches = useMemo(
    () => themeSwatches(theme.cssVariables),
    [theme.cssVariables],
  );
  const locked = !unlocked;

  return (
    <Card
      data-ocid={`theme.card.${theme.id.toString()}`}
      className={cn(
        "glass group relative overflow-hidden rounded-2xl border-border shadow-glass transition-smooth",
        "hover:-translate-y-0.5 hover:border-primary/40",
        applied && "border-primary/60 glow-ring",
        isPreviewing && !applied && "border-accent/60",
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 py-1">
        {/* Colour preview */}
        <div
          aria-hidden="true"
          className="relative h-24 w-full overflow-hidden rounded-xl border border-border/60"
          style={{
            backgroundImage:
              swatches.length > 0
                ? `linear-gradient(120deg, ${swatches.join(", ")})`
                : undefined,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="absolute bottom-2 left-2 flex gap-1.5">
            {swatches.slice(0, 5).map((color, index) => (
              <span
                key={`${theme.id.toString()}-swatch-${index}`}
                className="size-4 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
              {theme.name}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {theme.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {applied && (
              <Badge
                data-ocid={`theme.applied_badge.${theme.id.toString()}`}
                className="gap-1 rounded-full bg-primary text-primary-foreground"
              >
                <Check className="size-3" />
                Applied
              </Badge>
            )}
            {theme.premium && (
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-warning/50 text-warning"
              >
                <Crown className="size-3" />
                Premium
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {locked ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid={`theme.preview_button.${theme.id.toString()}`}
                onClick={isPreviewing ? onStopPreview : onPreview}
                className="rounded-xl"
              >
                <Eye className="size-4" />
                {isPreviewing ? "Stop preview" : "Preview"}
              </Button>
              <Button
                asChild
                size="sm"
                data-ocid={`theme.upgrade_button.${theme.id.toString()}`}
                className="rounded-xl bg-gradient-primary text-primary-foreground"
              >
                <Link to="/membership">
                  <Lock className="size-4" />
                  Unlock with ULTIMATE
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid={`theme.preview_button.${theme.id.toString()}`}
                onClick={isPreviewing ? onStopPreview : onPreview}
                className="rounded-xl"
              >
                <Eye className="size-4" />
                {isPreviewing ? "Stop preview" : "Preview"}
              </Button>
              <Button
                type="button"
                size="sm"
                data-ocid={`theme.apply_button.${theme.id.toString()}`}
                disabled={applied || isApplying}
                onClick={onApply}
                className="rounded-xl bg-gradient-primary text-primary-foreground"
              >
                {applied ? (
                  <>
                    <Check className="size-4" />
                    Applied
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {isApplying ? "Applying…" : "Apply theme"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeSkeleton({ id }: { id: string }) {
  return (
    <Card
      data-ocid={id}
      className="glass rounded-2xl border-border shadow-glass"
    >
      <CardContent className="space-y-4 py-1">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ThemesPage() {
  const { data: themes, isLoading, isError, refetch } = useThemes();
  const { data: membership } = useMembership();
  const applyTheme = useApplyTheme();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const appliedTheme = useMemo(
    () => themes?.find((view) => view.applied),
    [themes],
  );

  const previewTheme = useMemo(
    () => themes?.find((view) => view.theme.id.toString() === previewId),
    [themes, previewId],
  );

  const isUltimate =
    membership?.active === true && membership.tier === "ultimate";

  // Keep the document in sync: a live preview wins, otherwise the persisted
  // theme is restored, otherwise the base palette from index.css.
  useEffect(() => {
    if (previewTheme) {
      applyThemeVariables(
        previewTheme.theme.id.toString(),
        previewTheme.theme.cssVariables,
      );
      return;
    }
    if (appliedTheme) {
      applyThemeVariables(
        appliedTheme.theme.id.toString(),
        appliedTheme.theme.cssVariables,
      );
      return;
    }
    clearThemeVariables();
  }, [previewTheme, appliedTheme]);

  // Drop a stale preview if the theme list changes underneath it.
  useEffect(() => {
    if (previewId && themes && !previewTheme) setPreviewId(null);
  }, [previewId, themes, previewTheme]);

  const handleApply = (view: ThemeView) => {
    setPreviewId(null);
    applyTheme.mutate(view.theme.id);
  };

  const list = themes ?? [];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Make it yours"
        title="Theme store"
        description="Preview any theme live, then apply it instantly. Your choice is saved to your account and follows you across devices."
        actions={
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 rounded-full px-3 py-1",
              isUltimate
                ? "border-primary/50 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            <Crown className="size-3.5" />
            {isUltimate ? "ULTIMATE member" : "Free plan"}
          </Badge>
        }
      />

      {previewTheme && (
        <div
          data-ocid="theme.preview_banner"
          className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border-accent/40 px-4 py-3"
        >
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Eye className="size-4 text-accent" />
            Previewing{" "}
            <span className="font-semibold">{previewTheme.theme.name}</span> —
            this is a live preview, not yet saved.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="theme.stop_preview_button"
            onClick={() => setPreviewId(null)}
            className="rounded-xl"
          >
            <X className="size-4" />
            Stop preview
          </Button>
        </div>
      )}

      {isLoading && (
        <div
          data-ocid="theme.loading_state"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6"
        >
          {Array.from({ length: 6 }, (_, i) => `theme-skeleton-${i}`).map(
            (id) => (
              <ThemeSkeleton key={id} id={id} />
            ),
          )}
        </div>
      )}

      {isError && !isLoading && (
        <Card
          data-ocid="theme.error_state"
          className="glass rounded-2xl border-destructive/40 shadow-glass"
        >
          <CardContent className="flex flex-col items-start gap-3 py-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-foreground">
                Couldn't load themes
              </h2>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching the theme store. Please try
                again.
              </p>
            </div>
            <Button
              type="button"
              data-ocid="theme.retry_button"
              onClick={() => void refetch()}
              className="rounded-xl bg-gradient-primary text-primary-foreground"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <Card
          data-ocid="theme.empty_state"
          className="glass rounded-2xl border-border shadow-glass"
        >
          <CardContent className="flex flex-col items-start gap-3 py-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
              <Palette className="size-5" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-foreground">
                No themes available yet
              </h2>
              <p className="text-sm text-muted-foreground">
                The theme store is empty right now. Check back soon for new
                looks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && list.length > 0 && (
        <div
          data-ocid="theme.list"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6"
        >
          {list.map((view) => (
            <ThemeCard
              key={view.theme.id.toString()}
              view={view}
              isPreviewing={previewId === view.theme.id.toString()}
              isApplying={
                applyTheme.isPending &&
                applyTheme.variables?.toString() === view.theme.id.toString()
              }
              onPreview={() => setPreviewId(view.theme.id.toString())}
              onStopPreview={() => setPreviewId(null)}
              onApply={() => handleApply(view)}
            />
          ))}
        </div>
      )}

      {applyTheme.isError && (
        <p
          data-ocid="theme.apply_error"
          className="text-sm text-destructive"
          role="alert"
        >
          Couldn't apply that theme. Please try again.
        </p>
      )}
    </div>
  );
}
