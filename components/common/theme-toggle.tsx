"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme]);

  const handleToggle = () => {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  };

  const label = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle theme";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      disabled={!mounted}
      className={[
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
        "border border-admin-border bg-admin-bg",
        "text-admin-muted-foreground transition-colors duration-200",
        "hover:bg-admin-primary/10 hover:text-admin-primary",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-70",
        "sm:h-9 sm:w-9",
        className,
      ].join(" ")}
    >
      <span className="sr-only">{label}</span>

      {!mounted ? (
        <span className="h-4 w-4 animate-pulse rounded-full bg-admin-border sm:h-4 sm:w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4 sm:h-4 sm:w-4" />
      ) : (
        <Moon className="h-4 w-4 sm:h-4 sm:w-4" />
      )}

      {showLabel && mounted ? (
        <span className="ml-2 hidden text-sm font-medium lg:inline">
          {isDark ? "Light" : "Dark"}
        </span>
      ) : null}
    </button>
  );
}