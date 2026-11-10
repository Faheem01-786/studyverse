import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

/**
 * Minimal, intentional placeholder for a route whose full page is built in a
 * later task. It keeps navigation honest: the route resolves, the shell renders,
 * and the copy explains what will live here.
 */
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  upcoming,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  upcoming: string[];
}) {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card
        data-ocid="placeholder.card"
        className="glass rounded-2xl border-border shadow-glass"
      >
        <CardContent className="flex flex-col items-start gap-4 py-2">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glass">
            <Icon className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            This section is wired into the app shell and ready for its full
            experience. Coming next:
          </p>
          <ul className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
            {upcoming.map((entry) => (
              <li key={entry} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                {entry}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
