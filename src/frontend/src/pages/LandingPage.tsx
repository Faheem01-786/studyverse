import { SignInButton } from "@/components/InternetIdentity";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Crown,
  Flame,
  Globe,
  GraduationCap,
  Palette,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";

const FEATURES = [
  {
    icon: Timer,
    title: "Study tracking",
    body: "Run a focused timer and bank server-verified study time — every minute counts toward your goal.",
  },
  {
    icon: Sparkles,
    title: "XP & levels",
    body: "Earn XP for verified sessions and watch your level climb with a glowing progress bar.",
  },
  {
    icon: Target,
    title: "Daily quests",
    body: "Fresh objectives every day with progress bars and claimable XP rewards.",
  },
  {
    icon: Crown,
    title: "XP store",
    body: "Spend hard-earned XP on avatars, frames, badges and dashboard themes.",
  },
  {
    icon: GraduationCap,
    title: "Memberships",
    body: "Moderate, Advanced and Ultimate plans multiply your XP and unlock premium perks.",
  },
  {
    icon: Palette,
    title: "Themes",
    body: "Reskin the whole dashboard instantly with anime and premium violet-lit themes.",
  },
  {
    icon: BookOpen,
    title: "Study library",
    body: "Search curated materials by subject, class and board, then read in place.",
  },
  {
    icon: Globe,
    title: "Website hub",
    body: "Jump to trusted educational sites from one curated shortcut hub.",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    body: "Climb global, weekly, monthly and friends boards as your level rises.",
  },
  {
    icon: Flame,
    title: "Achievements",
    body: "Unlock badges for streaks, milestones and quest mastery as you progress.",
  },
];

const STEPS = [
  {
    label: "Sign in",
    body: "Secure Internet Identity — your data stays yours.",
  },
  { label: "Study", body: "Start a session, pick a subject and stay focused." },
  { label: "Level up", body: "Bank XP, finish quests and unlock rewards." },
];

export default function LandingPage() {
  const { identity } = useInternetIdentity();
  const authenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return (
    <div className="min-h-dvh bg-background">
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/70 px-4 md:px-8">
        <Link
          to="/"
          data-ocid="landing.brand.link"
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glass">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            STUDYVERSE
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authenticated ? (
            <Button asChild className="rounded-xl bg-gradient-primary">
              <Link to="/dashboard" data-ocid="landing.dashboard_button">
                Go to dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/sign-in" data-ocid="landing.signin_button">
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24">
          <div
            aria-hidden="true"
            className="animate-float pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-gradient-primary opacity-20 blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Flame className="size-3.5" />
                Study like it's a game
              </span>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                Study Smart. <span className="text-gradient">Earn XP.</span>{" "}
                Unlock Your World.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                STUDYVERSE is a premium study platform with RPG progression:
                earn XP for focused sessions, complete daily quests, unlock
                themes and climb the leaderboard.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {authenticated ? (
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-gradient-primary shadow-glass"
                  >
                    <Link to="/dashboard" data-ocid="landing.primary_button">
                      Enter your dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-gradient-primary shadow-glass"
                  >
                    <Link to="/sign-in" data-ocid="landing.primary_button">
                      Start studying
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl"
                >
                  <Link to="/leaderboard" data-ocid="landing.secondary_button">
                    View leaderboard
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="glass animate-fade-up rounded-2xl border-border shadow-glass">
              <CardContent className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Today
                  </span>
                  <span className="animate-pulse-glow rounded-full bg-gradient-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground">
                    Level 12
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold text-foreground">
                      1,240 XP
                    </span>
                    <span className="font-mono text-muted-foreground">
                      260 to next
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-4/5 rounded-full bg-gradient-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Streak", value: "14d" },
                    { label: "Today", value: "1h 20m" },
                    { label: "Quests", value: "3/5" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border bg-muted/40 p-3 text-center"
                    >
                      <p className="font-mono text-lg font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Everything in one place
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                A complete study super-platform
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="glass rounded-2xl border-border shadow-glass transition-smooth hover:-translate-y-0.5"
                  >
                    <CardContent className="space-y-3 py-2">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                        <Icon className="size-5" />
                      </span>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.body}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                How it works
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Three steps to your next level
              </h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
              {STEPS.map((step, index) => (
                <li
                  key={step.label}
                  className="glass rounded-2xl border border-border p-6 shadow-glass"
                >
                  <span className="font-mono text-3xl font-bold text-gradient">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-16 md:px-8 md:py-20">
          <div className="glass mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-border p-8 text-center shadow-glass md:p-12">
            <Crown className="size-8 text-primary" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Ready to start your streak?
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Sign in with Internet Identity to create your profile and begin
              earning XP today.
            </p>
            {authenticated ? (
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-gradient-primary shadow-glass"
              >
                <Link to="/dashboard" data-ocid="landing.cta_button">
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <SignInButton className="rounded-xl bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glass transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60" />
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/40 px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} STUDYVERSE. Study. Level up. Repeat.
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            data-ocid="landing.attribution.link"
            className="transition-smooth hover:text-foreground"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
