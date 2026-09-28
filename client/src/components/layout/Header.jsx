import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, CalendarHeart, LifeBuoy, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/context/SessionContext";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

const publicNav = [
  { to: "/about", key: "about" },
  { to: "/features", key: "features" },
  { to: "/postpartum-depression", key: "article" },
  { to: "/contact", key: "contact" },
];

const memberNav = [
  { to: "/dashboard", key: "dashboard" },
  { to: "/test", key: "test" },
  { to: "/therapy/new", key: "chat", match: "/therapy" },
  { to: "/consultation", key: "consultation" },
  { to: "/contact", key: "emergency" },
];

function useClickOutside(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    const handle = (event) => ref.current && !ref.current.contains(event.target) && onClose();
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onClose]);
}

export default function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Menus remember the path they were opened on, so navigating closes them automatically.
  const [menuOpenOn, setMenuOpenOn] = useState(null);
  const [userMenuOpenOn, setUserMenuOpenOn] = useState(null);
  const menuOpen = menuOpenOn === location.pathname;
  const userMenuOpen = userMenuOpenOn === location.pathname;
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpenOn(null), []);
  const closeUserMenu = useCallback(() => setUserMenuOpenOn(null), []);
  useClickOutside(menuRef, menuOpen, closeMenu);
  useClickOutside(userMenuRef, userMenuOpen, closeUserMenu);

  const navItems = isAuthenticated ? memberNav : publicNav;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (item) => location.pathname.startsWith(item.match ?? item.to);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("nav.skipToContent")}
      </a>

      {!isAuthenticated && (
        <div className="h-8 bg-[#17123f] text-white dark:bg-card dark:text-foreground">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-center gap-2 px-4 text-xs sm:justify-between sm:px-6 lg:px-8">
            <p className="hidden items-center gap-2 text-white/80 sm:flex dark:text-muted-foreground">
              <LifeBuoy className="h-3.5 w-3.5 text-[#8fe0c9]" />
              {t("supportBar.text")}
            </p>
            <Link
              to="/contact#crisis"
              className="inline-flex items-center gap-1 font-semibold text-white hover:underline dark:text-foreground"
            >
              <LifeBuoy className="h-3.5 w-3.5 text-[#8fe0c9] sm:hidden" />
              {t("supportBar.link")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div ref={menuRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="shrink-0 rounded-lg transition-opacity hover:opacity-85"
            aria-label="MumWell"
          >
            <Logo tagline={t("brand.tagline")} taglineClassName="hidden sm:block" />
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5" aria-label={t("nav.main")}>
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Button asChild size="sm" className="ml-1 hidden sm:inline-flex whitespace-nowrap rounded-full">
                  <Link to="/program">
                    <CalendarHeart className="h-4 w-4" />
                    {t("nav.program")}
                  </Link>
                </Button>

                <div ref={userMenuRef} className="relative hidden xl:block">
                  <button
                    type="button"
                    aria-label={t("nav.accountMenu")}
                    aria-expanded={userMenuOpen}
                    onClick={() => setUserMenuOpenOn(userMenuOpen ? null : location.pathname)}
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-coral-foreground font-semibold transition-transform hover:scale-105"
                  >
                    {user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border bg-popover py-2 text-popover-foreground shadow-[var(--shadow-lift)]">
                      <div className="border-b px-4 pb-2 mb-1">
                        <p className="truncate text-sm font-semibold">{user?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary">
                        <ShieldCheck className="h-4 w-4" />
                        {t("nav.account")}
                      </Link>
                      <Link to="/notifications" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary">
                        <Bell className="h-4 w-4" />
                        {t("nav.notifications")}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.signOut")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="ml-1 hidden sm:inline-flex rounded-full">
                  <Link to="/login">{t("nav.signIn")}</Link>
                </Button>
                <Button asChild size="sm" variant="coral" className="ml-1 hidden sm:inline-flex rounded-full">
                  <Link to="/signup">{t("nav.getStarted")}</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpenOn(menuOpen ? null : location.pathname)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              aria-label={t("nav.mobile")}
              className="xl:hidden border-t pb-5 pt-3"
            >
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium",
                      isActive(item) ? "bg-secondary text-primary" : "hover:bg-secondary",
                    )}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link to="/program" className="rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary">
                      {t("nav.program")}
                    </Link>
                    <Link to="/account" className="rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary">
                      {t("nav.account")}
                    </Link>
                    <Link to="/notifications" className="rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary">
                      {t("nav.notifications")}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl px-4 py-3 text-left text-base font-medium text-destructive hover:bg-secondary"
                    >
                      {t("nav.signOut")}
                    </button>
                  </>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link to="/login">{t("nav.signIn")}</Link>
                    </Button>
                    <Button asChild variant="coral">
                      <Link to="/signup">{t("nav.getStarted")}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
