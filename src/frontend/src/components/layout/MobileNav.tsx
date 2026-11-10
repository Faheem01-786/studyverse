import { STUDENT_NAV } from "@/lib/navigation";
import { Link } from "@tanstack/react-router";

/** Bottom tab bar for viewports below `lg`. */
export function MobileNav() {
  const items = STUDENT_NAV.filter((item) => item.mobile).slice(0, 5);
  return (
    <nav
      aria-label="Primary"
      data-ocid="mobile_nav.panel"
      className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-card/80 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            data-ocid={`mobile_nav.${item.to.replace(/^\//, "").replace(/\//g, "-")}.link`}
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-smooth"
          >
            <Icon className="size-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
