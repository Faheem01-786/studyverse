import { Button } from "@/components/ui/button";
import { useColorMode } from "@/hooks/useColorMode";
import { Moon, Sun } from "lucide-react";

/** Light/dark mode toggle. The choice persists via useColorMode. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useColorMode();
  const isDark = mode === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-ocid="theme.toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggle}
      className={className}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
