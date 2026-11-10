import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { XpMeter } from "@/components/layout/XpMeter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallerProfile } from "@/hooks/useQueries";
import { initials } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";

/** Sticky glass header holding the XP meter, theme toggle and account menu. */
export function TopBar() {
  const { data: profile } = useCallerProfile();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const displayName = profile?.displayName ?? "Student";

  return (
    <header
      data-ocid="topbar.panel"
      className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/70 px-4 md:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="font-display text-base font-bold tracking-tight text-foreground lg:hidden">
          STUDYVERSE
        </span>
        <XpMeter className="hidden sm:flex" />
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="account.open_modal_button"
              aria-label="Open account menu"
              className="rounded-full outline-none transition-smooth focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-gradient-primary font-mono text-xs font-semibold text-primary-foreground">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">
              {displayName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" data-ocid="account.profile.link">
                <UserRound className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-ocid="account.signout_button"
              variant="destructive"
              onSelect={() => {
                void queryClient.cancelQueries();
                queryClient.clear();
                clear();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
