import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  variant?: "neutral" | "accent";
  className?: string;
}

export function Chip({ children, variant = "neutral", className = "" }: ChipProps) {
  const base = variant === "accent" ? "chip-accent" : "chip";
  return <span className={`${base} ${className}`}>{children}</span>;
}
