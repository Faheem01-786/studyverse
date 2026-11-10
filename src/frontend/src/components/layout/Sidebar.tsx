import { ADMIN_NAV, type NavItem, STUDENT_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

function NavLink({
  item,
  onNavigate,
}: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      data-ocid={`nav.${item.to.replace(/^\//, "").replace(/\//g, "-")}.link`}
      activeProps={{
        className:
          "bg-gradient-primary text-primary-foreground shadow-glass hover:brightness-110",
      }}
      inactiveProps={{
        className:
          "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      }}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth"
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/** Desktop-only fixed sidebar with the primary student navigation. */
export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside
      data-ocid="sidebar.panel"
      className="glass sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar/80 px-4 py-6 lg:flex"
    >
      <Link
        to="/dashboard"
        data-ocid="sidebar.brand.link"
        className="flex items-center gap-2.5 px-2"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glass">
          <GraduationCap className="size-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
          STUDYVERSE
        </span>
      </Link>

      <nav
        aria-label="Primary"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      >
        {STUDENT_NAV.map((item) => (
          <NavLink key={item.to} item={item} />
        ))}
        {isAdmin && <NavLink item={ADMIN_NAV} />}
      </nav>

      <p className="px-2 text-xs text-muted-foreground">
        Study. Level up. Repeat.
      </p>
    </aside>
  );
}
