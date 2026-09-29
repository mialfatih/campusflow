import Link from "next/link";

import { signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export async function AppHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let unreadNotifications = 0;

  if (user) {
    const [profileResult, notificationResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("notifications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);

    username = profileResult.data?.username ?? null;

    unreadNotifications = notificationResult.count ?? 0;
  }

  const profileHref = username ? `/profile/${username}` : "/profile/settings";

  const notificationLabel =
    unreadNotifications > 99 ? "99+" : unreadNotifications;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* ===============================================
              BRAND
          ================================================ */}

          <Link
            href="/dashboard"
            className="shrink-0 text-xl font-semibold tracking-tight text-slate-950"
          >
            CampusFlow
          </Link>

          {/* ===============================================
              DESKTOP NAVIGATION
          ================================================ */}

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="/dashboard">Dashboard</NavLink>

            <NavLink href="/tasks">Tasks</NavLink>

            <NavLink href="/feed">Feed</NavLink>

            <NavLink href="/friends">Friends</NavLink>

            <Link
              href="/notifications"
              className="relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {notificationLabel}
                </span>
              )}
            </Link>

            <NavLink href={profileHref}>Profile</NavLink>

            <form action={signOut} className="ml-2">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Sign out
              </button>
            </form>
          </nav>

          {/* ===============================================
              MOBILE / TABLET ACTIONS
          ================================================ */}

          <div className="flex items-center gap-2 lg:hidden">
            {/* Notification shortcut */}

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>Notifications</span>

              {unreadNotifications > 0 && (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {notificationLabel}
                </span>
              )}
            </Link>

            {/* Native mobile menu */}

            <details className="group relative">
              <summary
                aria-label="Open navigation menu"
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
              >
                <span className="sr-only">Open navigation menu</span>

                <MenuIcon />
              </summary>

              <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Navigation
                  </p>

                  {username && (
                    <p className="mt-1 truncate text-sm font-medium text-slate-700">
                      @{username}
                    </p>
                  )}
                </div>

                <nav className="p-2">
                  <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>

                  <MobileNavLink href="/tasks">Tasks</MobileNavLink>

                  <MobileNavLink href="/feed">Feed</MobileNavLink>

                  <MobileNavLink href="/friends">Friends</MobileNavLink>

                  <MobileNavLink href="/notifications">
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>Notifications</span>

                      {unreadNotifications > 0 && (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                          {notificationLabel}
                        </span>
                      )}
                    </span>
                  </MobileNavLink>

                  <MobileNavLink href={profileHref}>Profile</MobileNavLink>
                </nav>

                <div className="border-t border-slate-100 p-3">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   DESKTOP NAV LINK
========================================================= */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MOBILE NAV LINK
========================================================= */

function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MENU ICON
========================================================= */

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
