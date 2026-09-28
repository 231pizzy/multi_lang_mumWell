import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { PageSpinner } from "@/components/PageSpinner";
import { useSession } from "@/context/SessionContext";
import { cn } from "@/lib/utils";

// Scroll to the top on navigation, or to the #hash target when there is one.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a tick so lazily-loaded pages have rendered the target.
      const id = setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  const { isAuthenticated } = useSession();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1} className={cn("flex-1 outline-none", isAuthenticated ? "pt-18" : "pt-26")}>
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
