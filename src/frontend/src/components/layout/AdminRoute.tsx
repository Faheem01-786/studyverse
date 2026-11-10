import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Renders children only for an authorized administrator. Non-admins see a
 * clear recovery path back to their dashboard; the backend still enforces
 * authorization on every admin method.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { data: isAdmin, isLoading, isError } = useIsAdmin();

  if (isLoading) {
    return (
      <div
        data-ocid="admin.loading_state"
        className="space-y-4"
        aria-busy="true"
      >
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !isAdmin) {
    return (
      <section
        data-ocid="admin.error_state"
        className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <ShieldAlert className="size-6" />
        </span>
        <h2 className="font-display text-xl font-bold text-foreground">
          Administrators only
        </h2>
        <p className="text-sm text-muted-foreground">
          This area is restricted to platform administrators. If you believe you
          should have access, contact the platform owner.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/dashboard" data-ocid="admin.back_button">
            Back to dashboard
          </Link>
        </Button>
      </section>
    );
  }

  return <>{children}</>;
}
