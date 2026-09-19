import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export async function AppHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    username = profile?.username ?? null;
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/dashboard"
          className="text-xl font-semibold tracking-tight text-slate-950"
        >
          CampusFlow
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Dashboard
          </Link>

          <Link
            href="/tasks"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Tasks
          </Link>

          <Link
            href="/feed"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Feed
          </Link>

          <Link
            href="/friends"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Friends
          </Link>

          <Link
            href={username ? `/profile/${username}` : "/profile/settings"}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Profile
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
