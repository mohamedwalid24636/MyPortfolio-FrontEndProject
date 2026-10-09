import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger, in seconds. */
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
}

/**
 * Fades content in the first time it scrolls into view.
 * `once: true` keeps the animation cheap — it never replays while scrolling back up.
 *
 * Visitors who ask for reduced motion get the content immediately with no transform,
 * which mirrors the global CSS rule for animated elements.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = "div" }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
