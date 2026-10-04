import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Briefcase,
  FileText,
  FolderKanban,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  Palette,
  Server,
  Shapes,
  Sparkles,
  Tags as TagsIcon,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RESOURCE_SPECS } from "@/pages/admin/adminConfig";

interface NavItem {
  to: string;
  label: string;
  icon: typeof User;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

/** Sidebar structure, grouped by what the visitor actually sees on the site. */
const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Identity",
    items: [
      { to: "/admin/profile", label: "Profile", icon: User },
      { to: "/admin/social-links", label: "Social links", icon: Link2 },
      { to: "/admin/resumes", label: "Resumes", icon: FileText },
    ],
  },
  {
    heading: "Work",
    items: [
      { to: "/admin/projects", label: "Projects", icon: FolderKanban },
      { to: "/admin/experience", label: "Experience", icon: Briefcase },
      { to: "/admin/education", label: "Education", icon: GraduationCap },
      { to: "/admin/certifications", label: "Certifications", icon: Award },
    ],
  },
  {
    heading: "Content",
    items: [
      { to: "/admin/services", label: "Services", icon: Handshake },
      { to: "/admin/skills", label: "Skills", icon: Sparkles },
      { to: "/admin/achievements", label: "Achievements", icon: Award },
      { to: "/admin/blog", label: "Blog posts", icon: BookOpen },
    ],
  },
  {
    heading: "Taxonomy",
    items: [
      { to: "/admin/categories", label: "Categories", icon: Shapes },
      { to: "/admin/tags", label: "Tags", icon: TagsIcon },
      { to: "/admin/technologies", label: "Technologies", icon: Wrench },
      { to: "/admin/skill-types", label: "Skill types", icon: Palette },
    ],
  },
  {
    heading: "Inbox",
    items: [{ to: "/admin/messages", label: "Messages", icon: Mail }],
  },
];

const SPEC_LABELS = new Map(RESOURCE_SPECS.map((spec) => [spec.key, spec.plural]));

/** Titles the admin area and provides a link back to the public site. */
export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  // A navigation should never leave the drawer covering the new page on mobile.
  useEffect(() => setIsSidebarOpen(false), [location.pathname]);

  // The API keeps no session to revoke, so dropping the token is the whole sign-out. Navigating
  // explicitly is what stops the guard from treating the now-empty token as a redirect loop.
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const currentLabel =
    location.pathname === "/admin" ? "Dashboard" : (SPEC_LABELS.get(location.pathname.replace("/admin/", "")) ?? "Admin");

  return (
    <div className="min-h-dvh bg-ink-950 text-fg">
      <div className="flex min-h-dvh">
        {/* ------------------------------------------------------------ sidebar */}
        <AnimatePresence>
          {isSidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-ink-950/80 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
          ) : null}
        </AnimatePresence>

        {/* On mobile the drawer is fixed and inset-y-0 already caps it at the viewport. On desktop it
            has to stay in flow (sticky, not fixed, so no spacer element is needed) but MUST still be
            given a definite height: `lg:static` here would drop the inset constraint and let the nav
            size the whole page. `lg:self-start` stops the row's default align-items:stretch from
            re-inflating it, and `lg:h-dvh` is what actually lets the nav scroll internally. */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-white/8 bg-ink-900 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <Server aria-hidden="true" className="size-5 text-accent-300" />
              <span className="font-display text-sm font-bold tracking-wide">Content manager</span>
            </Link>
            <button
              type="button"
              className="btn-icon lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          {/* min-h-0 is load-bearing: a flex item defaults to min-height:auto, which refuses to shrink
              below its content and would let this list spill past the aside instead of scrolling.
              flex-1 only does its job once that floor is removed. overscroll-contain stops the
              scroll from chaining to the page when the list bottoms out. */}
          <nav
            aria-label="Admin sections"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.heading} className="mb-5">
                <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                  {group.heading}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/admin"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            isActive
                              ? "bg-accent-500/15 font-semibold text-accent-100"
                              : "text-fg-muted hover:bg-white/[0.04] hover:text-fg"
                          }`
                        }
                      >
                        <item.icon aria-hidden="true" className="size-4 shrink-0" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-white/8 p-4">
            <Link to="/" className="btn-outline w-full text-xs">
              View the public site
            </Link>
          </div>
        </aside>

        {/* -------------------------------------------------------------- main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-ink-950/85 px-4 py-3 backdrop-blur-xl sm:px-6">
            <button
              type="button"
              className="btn-icon lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu aria-hidden="true" className="size-4" />
            </button>
            <p className="min-w-0 truncate font-display text-sm font-semibold text-fg">{currentLabel}</p>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden max-w-48 truncate text-xs text-fg-muted lg:inline">{session?.email}</span>
              <button type="button" className="btn-outline text-xs" onClick={handleLogout}>
                <LogOut aria-hidden="true" className="size-3.5" />
                Sign out
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}