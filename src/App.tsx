import { lazy, type ReactNode } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useLocation, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SiteDataProvider } from "@/context/SiteDataContext";
import { DataVersionProvider } from "@/context/DataVersionContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotFoundBlock } from "@/components/ui/NotFoundBlock";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboardPage, pickSpec } from "@/pages/admin/AdminDashboardPage";
import { ResourcePage } from "@/pages/admin/ResourcePage";
import { LoginPage } from "@/pages/admin/LoginPage";

/* Route-level code splitting keeps the initial bundle small. */
const HomePage = lazy(() => import("@/pages/HomePage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const ResumePage = lazy(() => import("@/pages/ResumePage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));

function NotFoundRoute() {
  return (
    <NotFoundBlock
      title="Page not found"
      description="The page you are looking for does not exist, or it has been moved."
      showProjectsLink
    />
  );
}

function AdminNotFoundRoute() {
  return (
    <NotFoundBlock
      title="No such admin section"
      description="Pick a section from the sidebar to manage your content."
    />
  );
}

/**
 * Every admin section renders the same generic page — the resource schema decides what it shows.
 * An unknown segment falls through to a 404 instead of an empty table.
 */
function AdminResourcePage() {
  const { resourceKey } = useParams();
  const spec = pickSpec(resourceKey);
  if (!spec) return <AdminNotFoundRoute />;
  return <ResourcePage spec={spec} />;
}

/**
 * Keeps unauthenticated visitors out of the admin tree.
 *
 * This is a convenience, not the security boundary: it saves someone from landing on a panel full
 * of failed requests, but the server answers 401 to every write regardless of what the browser
 * believes. The `from` state is what sends them back where they were headed after signing in.
 */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;

    // `from` travels as a query parameter rather than router state so it survives a refresh on the
    // login page. LoginPage re-checks that it points inside /admin before following it.
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "resume", element: <ResumePage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "blog/:slug", element: <BlogPostPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: ":resourceKey", element: <AdminResourcePage /> },
    ],
  },
  // `basename` is the path the site is served from. Without it every route 404s on a GitHub Pages
  // project site, where the app lives under /<repo>/ rather than at the domain root.
], { basename: import.meta.env.BASE_URL });

export function App() {
  return (
    <ErrorBoundary>
      {/*
        DataVersionProvider sits above both trees so an admin write invalidates the public site's
        reads too. AuthProvider goes above the router because the admin guard and the header both
        need to know who is signed in, and because apiClient reads the token from storage rather
        than from React.
      */}
      <DataVersionProvider>
        <AuthProvider>
          <ToastProvider>
            <SiteDataProvider>
              <RouterProvider router={router} />
            </SiteDataProvider>
          </ToastProvider>
        </AuthProvider>
      </DataVersionProvider>
    </ErrorBoundary>
  );
}