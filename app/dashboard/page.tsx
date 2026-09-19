export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, university, major")
    .eq("id", user.id)
    .single();

  const [totalResult, todoResult, progressResult, submittedResult] =
    await Promise.all([
      supabase.from("tasks").select("*", {
        count: "exact",
        head: true,
      }),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "todo"),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "in_progress"),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "submitted"),
    ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight"
          >
            CampusFlow
          </Link>

          <form action={signOut}>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm text-slate-500">Dashboard</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Welcome, {profile?.full_name ?? user.email}
          </h1>

          <p className="mt-2 text-slate-600">Here is your academic progress.</p>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard label="Total Tasks" value={totalResult.count ?? 0} />

          <DashboardCard label="To Do" value={todoResult.count ?? 0} />

          <DashboardCard
            label="In Progress"
            value={progressResult.count ?? 0}
          />

          <DashboardCard label="Submitted" value={submittedResult.count ?? 0} />
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/courses"
            className="rounded-2xl border bg-white p-6 transition hover:border-slate-400"
          >
            <p className="text-lg font-medium text-slate-950">Courses</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your semester and courses.
            </p>
          </Link>

          <Link
            href="/tasks"
            className="rounded-2xl border bg-white p-6 transition hover:border-slate-400"
          >
            <p className="text-lg font-medium text-slate-950">Tasks</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track assignments and deadlines.
            </p>
          </Link>

          <Link
            href="/activity"
            className="rounded-2xl border bg-white p-6 transition hover:border-slate-400"
          >
            <p className="text-lg font-medium text-slate-950">Activity</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review your academic progress and assignment history.
            </p>
          </Link>

          <div className="rounded-2xl border bg-white p-6">
            <p className="text-lg font-medium text-slate-950">Friends</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Social progress is coming in the next build stage.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}
