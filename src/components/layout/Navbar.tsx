import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useSiteData } from "@/context/SiteDataContext";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const { data } = useSiteData();

  useLockBodyScroll(isMenuOpen);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 16);

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const name = data.profile?.fullName?.trim() || "Portfolio";
  const role = data.profile?.professionalTitle?.trim() || "Portfolio";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const resumeHref = data.activeResume?.fileUrl ? `${data.activeResume.fileUrl}#view=FitH` : "/resume";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? "border-b border-white/8 bg-ink-950/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="container-page" aria-label="Primary">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-16" : "h-20"}`}>
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label={`${name} — home`}
          >
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-600 via-accent-500 to-cyan-400 font-display text-sm font-bold text-white shadow-lg shadow-accent-600/25 transition-transform duration-300 group-hover:scale-105">
              {initials || "P"}
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-sm font-semibold text-fg">{name}</span>
              <span className="font-mono text-[0.65rem] tracking-wide text-fg-subtle">{role}</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive ? "text-accent-200" : "text-fg-muted hover:text-fg"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive ? (
                        <motion.span
                          layoutId="nav-active-pill"
                          className="absolute inset-0 -z-10 rounded-lg border border-accent-500/30 bg-accent-500/12"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a href={resumeHref} target={data.activeResume ? "_blank" : undefined} rel={data.activeResume ? "noreferrer noopener" : undefined} className="btn-primary hidden !px-4 !py-2.5 sm:inline-flex">
              <Download aria-hidden="true" className="size-4" />
              Resume
            </a>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-fg transition hover:border-accent-500/40 lg:hidden"
            >
              {isMenuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className="h-px origin-left bg-gradient-to-r from-accent-500 via-fuchsia-500 to-cyan-400 transition-transform duration-150"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            id="mobile-navigation"
            key="mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="border-b border-white/8 bg-ink-950/97 backdrop-blur-xl lg:hidden"
          >
            <ul className="container-page flex flex-col gap-1 py-5">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3.5 text-base font-medium transition ${
                        isActive ? "bg-accent-500/12 text-accent-200" : "text-fg-muted hover:bg-white/[0.05] hover:text-fg"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href={resumeHref}
                  target={data.activeResume ? "_blank" : undefined}
                  rel={data.activeResume ? "noreferrer noopener" : undefined}
                  className="btn-primary w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Download aria-hidden="true" className="size-4" />
                  Download resume
                </a>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
