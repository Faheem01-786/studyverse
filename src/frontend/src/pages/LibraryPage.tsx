import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRecordResourceDownload,
  useSearchResources,
} from "@/hooks/useQueries";
import { formatDate } from "@/lib/format";
import type { ResourceFilter, ResourceView } from "@/types";
import {
  AlertTriangle,
  BookOpen,
  Download,
  FileText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

const CATEGORIES = [
  "Notes",
  "Sample Papers",
  "Previous Year Questions",
] as const;

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "English",
  "Computer Science",
] as const;

const CLASS_LEVELS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
] as const;

const BOARDS = ["CBSE", "NCERT"] as const;

const ALL = "all";

/** A single filter dropdown with an "All" reset option. */
function FilterSelect({
  label,
  value,
  options,
  onChange,
  ocid,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  ocid: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={ocid}
        className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next === ALL ? "" : next)}
      >
        <SelectTrigger
          id={ocid}
          data-ocid={ocid}
          className="w-full rounded-xl border-border bg-muted/40 transition-smooth hover:border-primary/40"
        >
          <SelectValue placeholder={`All ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="glass rounded-xl border-border">
          <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Metadata pill used across the resource card. */
function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-border bg-muted/40 font-medium text-muted-foreground"
    >
      {children}
    </Badge>
  );
}

/** One resource card with viewer and download actions. */
function ResourceCard({
  resource,
  index,
  onOpen,
  onDownload,
  downloading,
}: {
  resource: ResourceView;
  index: number;
  onOpen: (resource: ResourceView) => void;
  onDownload: (resource: ResourceView) => void;
  downloading: boolean;
}) {
  return (
    <article
      data-ocid={`library.item.${index + 1}`}
      className="glass group flex flex-col gap-4 rounded-2xl border-border p-5 shadow-glass transition-smooth hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glass">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-snug text-foreground">
            {resource.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {resource.description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge className="rounded-full bg-primary/15 text-primary">
          {resource.category}
        </Badge>
        <MetaBadge>{resource.subject}</MetaBadge>
        <MetaBadge>{resource.classLevel}</MetaBadge>
        <MetaBadge>{resource.board}</MetaBadge>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="font-mono text-xs text-muted-foreground">
          {resource.downloadCount.toString()} downloads ·{" "}
          {formatDate(resource.createdAt)}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid={`library.open_button.${index + 1}`}
            onClick={() => onOpen(resource)}
            className="rounded-xl border border-border transition-smooth hover:border-primary/50 hover:text-primary"
          >
            <BookOpen className="size-4" />
            Read
          </Button>
          <Button
            type="button"
            size="sm"
            data-ocid={`library.download_button.${index + 1}`}
            disabled={downloading}
            onClick={() => onDownload(resource)}
            className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110"
          >
            <Download className="size-4" />
            {downloading ? "Saving…" : "Download"}
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Layout-matched skeleton grid shown while a search is in flight. */
function LoadingGrid() {
  const ids = Array.from({ length: 6 }, (_, i) => `library-skeleton-${i}`);
  return (
    <div
      data-ocid="library.loading_state"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {ids.map((id) => (
        <div
          key={id}
          className="glass flex flex-col gap-4 rounded-2xl border-border p-5"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="size-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [board, setBoard] = useState("");
  const [selected, setSelected] = useState<ResourceView | null>(null);

  const filter = useMemo<ResourceFilter>(() => {
    const next: ResourceFilter = {};
    if (searchTerm.trim()) next.searchTerm = searchTerm.trim();
    if (category) next.category = category;
    if (subject) next.subject = subject;
    if (classLevel) next.classLevel = classLevel;
    if (board) next.board = board;
    return next;
  }, [searchTerm, category, subject, classLevel, board]);

  const resourcesQuery = useSearchResources(filter);
  const downloadMutation = useRecordResourceDownload();

  const resources = resourcesQuery.data ?? [];
  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    category !== "" ||
    subject !== "" ||
    classLevel !== "" ||
    board !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("");
    setSubject("");
    setClassLevel("");
    setBoard("");
  };

  const handleDownload = (resource: ResourceView) => {
    const url = resource.file.getDirectURL();
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resource.fileName || resource.title;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    downloadMutation.mutate(resource.id);
  };

  return (
    <div data-ocid="library.page" className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Resources"
        title="Study Library"
        description="Search and filter study materials across Class 6 to 12, then read them in place or download for offline study."
      />

      <section
        data-ocid="library.filters"
        className="glass space-y-4 rounded-2xl border-border p-4 shadow-glass md:p-5"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-ocid="library.search_input"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title or description…"
            aria-label="Search study resources"
            className="h-11 rounded-xl border-border bg-muted/40 pl-9 transition-smooth focus-visible:border-primary/50"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Category"
            value={category}
            options={CATEGORIES}
            onChange={setCategory}
            ocid="library.category_select"
          />
          <FilterSelect
            label="Subject"
            value={subject}
            options={SUBJECTS}
            onChange={setSubject}
            ocid="library.subject_select"
          />
          <FilterSelect
            label="Class Level"
            value={classLevel}
            options={CLASS_LEVELS}
            onChange={setClassLevel}
            ocid="library.class_select"
          />
          <FilterSelect
            label="Board"
            value={board}
            options={BOARDS}
            onChange={setBoard}
            ocid="library.board_select"
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {resourcesQuery.isSuccess
                ? `${resources.length} ${resources.length === 1 ? "resource" : "resources"} found`
                : "Filtering resources…"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-ocid="library.clear_button"
              onClick={clearFilters}
              className="rounded-xl border border-border transition-smooth hover:border-primary/50 hover:text-primary"
            >
              <X className="size-4" />
              Clear filters
            </Button>
          </div>
        )}
      </section>

      {resourcesQuery.isLoading ? (
        <LoadingGrid />
      ) : resourcesQuery.isError ? (
        <div
          data-ocid="library.error_state"
          className="glass flex flex-col items-center gap-4 rounded-2xl border-destructive/40 p-10 text-center shadow-glass"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertTriangle className="size-6" />
          </span>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-foreground">
              We couldn't load the library
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Something went wrong while searching resources. Check your
              connection and try again.
            </p>
          </div>
          <Button
            type="button"
            data-ocid="library.retry_button"
            onClick={() => void resourcesQuery.refetch()}
            className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110"
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : resources.length === 0 ? (
        <div
          data-ocid="library.empty_state"
          className="glass flex flex-col items-center gap-4 rounded-2xl border-border p-10 text-center shadow-glass"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <BookOpen className="size-6" />
          </span>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-foreground">
              No resources match your filters
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Try a different subject, class level or board — or clear the
              filters to browse everything in the library.
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              data-ocid="library.empty_clear_button"
              onClick={clearFilters}
              className="rounded-xl border border-border transition-smooth hover:border-primary/50 hover:text-primary"
            >
              <X className="size-4" />
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource, index) => (
            <ResourceCard
              key={resource.id.toString()}
              resource={resource}
              index={index}
              onOpen={setSelected}
              onDownload={handleDownload}
              downloading={
                downloadMutation.isPending &&
                downloadMutation.variables === resource.id
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          data-ocid="library.viewer_modal"
          className="glass max-w-4xl gap-4 rounded-2xl border-border shadow-glass"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold text-foreground">
              {selected?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selected
                ? `${selected.category} · ${selected.subject} · ${selected.classLevel} · ${selected.board}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                <iframe
                  data-ocid="library.viewer_frame"
                  title={`${selected.title} preview`}
                  src={selected.file.getDirectURL()}
                  className="h-[60vh] w-full"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {selected.fileName}
                </span>
                <Button
                  type="button"
                  data-ocid="library.viewer_download_button"
                  disabled={downloadMutation.isPending}
                  onClick={() => handleDownload(selected)}
                  className="rounded-xl bg-gradient-primary text-primary-foreground shadow-glass transition-smooth hover:brightness-110"
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
