import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useIsAdmin } from "@/hooks/useQueries";
import type { ReactNode } from "react";

/**
 * Shared authenticated shell: desktop sidebar, sticky top bar with the XP
 * meter and theme toggle, mobile bottom navigation, and the content region.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: isAdmin } = useIsAdmin();

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar isAdmin={!!isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          data-ocid="page.content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-6 md:pt-8 lg:pb-12"
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
