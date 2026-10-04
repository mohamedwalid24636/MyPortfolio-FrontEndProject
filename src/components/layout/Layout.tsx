import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice";
import { RouteFallback } from "@/components/ui/RouteFallback";

/** Application shell: chrome that is identical on every route. */
export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <ScrollToTop />
      <Navbar />
      <ApiStatusNotice />

      <main id="main-content" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
