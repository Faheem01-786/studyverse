import { SignInButton } from "@/components/InternetIdentity";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect } from "react";

const HIGHLIGHTS = [
  { icon: Sparkles, text: "Earn XP for every verified study session" },
  { icon: Trophy, text: "Climb leaderboards as your level rises" },
  { icon: ShieldCheck, text: "Your data is private to your Internet Identity" },
];

export default function SignInPage() {
  const { identity, isInitializing, isLoggingIn, isLoginError } =
    useInternetIdentity();
  const navigate = useNavigate();
  const authenticated = !!identity && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    if (authenticated) {
      void navigate({ to: "/dashboard" });
    }
  }, [authenticated, navigate]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link
          to="/"
          data-ocid="signin.brand.link"
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glass">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            STUDYVERSE
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          aria-hidden="true"
          className="animate-float pointer-events-none absolute left-1/2 top-1/3 size-80 -translate-x-1/2 rounded-full bg-gradient-primary opacity-15 blur-3xl"
        />
        <section
          data-ocid="signin.panel"
          className="glass animate-fade-up relative w-full max-w-md space-y-6 rounded-2xl border border-border p-8 shadow-glass"
        >
          <div className="space-y-2 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Sign in to STUDYVERSE
            </h1>
            <p className="text-sm text-muted-foreground">
              Use Internet Identity to access your private study workspace.
            </p>
          </div>

          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.text}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="size-4" />
                  </span>
                  {item.text}
                </li>
              );
            })}
          </ul>

          <SignInButton className="w-full rounded-xl bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glass transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60" />

          {isInitializing && (
            <output
              data-ocid="signin.loading_state"
              className="block text-center text-xs text-muted-foreground"
            >
              Checking your session…
            </output>
          )}

          {isLoggingIn && (
            <output
              data-ocid="signin.pending_state"
              className="block text-center text-xs text-muted-foreground"
            >
              Waiting for Internet Identity…
            </output>
          )}

          {isLoginError && (
            <p
              role="alert"
              data-ocid="signin.error_state"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
            >
              We couldn't complete sign-in. Please try again.
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            New here? Signing in creates your profile automatically.
          </p>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Can't access your account? Internet Identity is tied to your
                device or passkey. If you've lost it,{" "}
                <a
                  href="https://identity.ic0.app"
                  target="_blank"
                  rel="noreferrer"
                  data-ocid="signin.recovery.link"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  recover your identity
                </a>{" "}
                or create a new one — your progress is stored per identity.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-xl"
              data-ocid="signin.back_button"
            >
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
