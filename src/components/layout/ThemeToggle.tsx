"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/layout/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="relative size-5">
        <Sun
          aria-hidden="true"
          className="absolute inset-0 size-5 transition-[opacity,transform,filter] duration-200 ease-out dark:scale-[0.25] dark:opacity-0 dark:blur-sm"
        />
        <Moon
          aria-hidden="true"
          className="absolute inset-0 size-5 scale-[0.25] opacity-0 blur-sm transition-[opacity,transform,filter] duration-200 ease-out dark:scale-100 dark:opacity-100 dark:blur-none"
        />
      </span>
    </Button>
  );
}
