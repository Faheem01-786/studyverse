import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebsiteLinks } from "@/hooks/useQueries";
import type { WebsiteLink } from "@/types";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Globe,
  GraduationCap,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

/** Category → icon + accent, matched loosely so admin-added categories still render. */
const CATEGORY_STYLES: Array<{
  match: RegExp;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    match: /diksha|school|k-?12|primary/i,
    icon: GraduationCap,
    accent: "from-violet-500/25 to-indigo-500/10",
  },
  {
    match: /ncert|syllabus|curriculum|board|cbse/i,
    icon: BookOpen,
    accent: "from-indigo-500/25 to-blue-500/10",
  },
  {
    match: /course|mooc|swayam|university|higher/i,
    icon: Layers,
    accent: "from-fuchsia-500/25 to-violet-500/10",
  },
  {
    match: /practice|learn|khan|tutorial|skill/i,
    icon: Sparkles,
    accent: "from-blue-500/25 to-cyan-500/10",
  },
];

function styleFor(category: string) {
  const found = CATEGORY_STYLES.find((entry) => entry.match.test(category));
  return (
    found ?? {
      icon: Globe,
      accent: "from-violet-500/25 to-indigo-500/10",
    }
  );
}

/** Normalise a stored URL into a safe absolute https link, or null when unusable. */
function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  const href = safeHref(url);
  if (!href) return url;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LinkCard({ link, index }: { link: WebsiteLink; index: number }) {
  const { icon: Icon, accent } = styleFor(link.category);
  const href = safeHref(link.url);
  const host = hostOf(link.url);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-foreground ring-1 ring-inset ring-white/10`}
        >
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="min-w-0 space-y-1.5">
        <h3 className="truncate font-display text-base font-semibold text-foreground">
          {link.name}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {link.description}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Badge
          variant="secondary"
          className="max-w-[60%] truncate rounded-full font-medium"
        >
          {link.category}
        </Badge>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {host}
        </span>
      </div>
    </>
  );

  if (!href) {
    return (
      <Card
        data-ocid={`website_hub.item.${index}`}
        className="glass flex h-full flex-col rounded-2xl border-border opacity-70"
      >
        <CardContent className="flex h-full flex-col gap-4 py-2">
          {body}
          <p className="text-xs text-destructive">Link unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-ocid={`website_hub.link.${index}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="glass flex h-full flex-col rounded-2xl border-border transition-smooth group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-glass">
        <CardContent className="flex h-full flex-col gap-4 py-2">
          {body}
        </CardContent>
      </Card>
    </a>
  );
}

function LoadingState() {
  const ids = Array.from({ length: 6 }, (_, i) => `website-hub-skeleton-${i}`);
  return (
    <div
      data-ocid="website_hub.loading_state"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {ids.map((id) => (
        <Card key={id} className="glass rounded-2xl border-border">
          <CardContent className="space-y-4 py-2">
            <Skeleton className="size-11 rounded-2xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card
      data-ocid="website_hub.error_state"
      className="glass rounded-2xl border-destructive/30"
    >
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-foreground">
            We couldn't load the website shortcuts
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Something went wrong while fetching the curated links. Check your
            connection and try again.
          </p>
        </div>
        <Button
          type="button"
          onClick={onRetry}
          data-ocid="website_hub.retry_button"
          className="rounded-full"
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card
      data-ocid="website_hub.empty_state"
      className="glass rounded-2xl border-border"
    >
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
          <Globe className="size-7" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold text-foreground">
            No shortcuts yet
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Curated educational sites will appear here as soon as an
            administrator adds them to the hub.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WebsiteHubPage() {
  const { data: links, isLoading, isError, refetch } = useWebsiteLinks();

  const groups = useMemo(() => {
    const map = new Map<string, WebsiteLink[]>();
    for (const link of links ?? []) {
      const key = link.category.trim() || "General";
      const bucket = map.get(key);
      if (bucket) bucket.push(link);
      else map.set(key, [link]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [links]);

  const total = links?.length ?? 0;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Shortcuts"
        title="Website Hub"
        description="Curated educational sites — DIKSHA, NCERT, SWAYAM, Khan Academy, CBSE and more — each opens safely in a new tab."
        actions={
          !isLoading && !isError && total > 0 ? (
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-primary"
            >
              {total} {total === 1 ? "site" : "sites"}
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {groups.map(([category, items]) => (
            <section
              key={category}
              data-ocid="website_hub.section"
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {category}
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((link, index) => (
                  <LinkCard
                    key={link.id.toString()}
                    link={link}
                    index={index + 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
