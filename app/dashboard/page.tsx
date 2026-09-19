export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AppHeader } from "@/components/app-header";

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
      {/* HEADER */}
      <AppHeader />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* INTRO */}
        <section>
          <p className="text-sm font-medium text-blue-600">Dashboard</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Welcome, {profile?.full_name ?? user.email}
          </h1>

          <p className="mt-2 text-slate-600">Here is your academic progress.</p>

          {(profile?.major || profile?.university) && (
            <p className="mt-2 text-sm text-slate-400">
              {[profile.major, profile.university].filter(Boolean).join(" · ")}
            </p>
          )}
        </section>

        {/* STATISTICS */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard label="Total Tasks" value={totalResult.count ?? 0} />

          <DashboardCard label="To Do" value={todoResult.count ?? 0} />

          <DashboardCard
            label="In Progress"
            value={progressResult.count ?? 0}
          />

          <DashboardCard label="Submitted" value={submittedResult.count ?? 0} />
        </section>

        {/* PRIMARY ACTIONS */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Workspace</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your academic work and keep up with your classmates.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Link
              href="/tasks"
              className="group rounded-2xl border bg-white p-7 transition hover:border-slate-400 hover:shadow-sm"
            >
              <p className="text-xl font-semibold text-slate-950">Tasks</p>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Track assignments, deadlines, progress, checklists, and move
                work through your Kanban workflow.
              </p>

              <p className="mt-6 text-sm font-medium text-blue-600">
                Open assignments →
              </p>
            </Link>

            <Link
              href="/feed"
              className="group rounded-2xl border bg-white p-7 transition hover:border-slate-400 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-slate-950">Feed</p>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Follow meaningful academic progress from your friends
                    without manual social posts.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Social
                </span>
              </div>

              <p className="mt-6 text-sm font-medium text-blue-600">
                View progress feed →
              </p>
            </Link>
          </div>
        </section>

        {/* SECONDARY ACTIONS */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/courses"
            className="rounded-2xl border bg-white p-6 transition hover:border-slate-400 hover:shadow-sm"
          >
            <p className="text-lg font-medium text-slate-950">Courses</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your semesters and courses.
            </p>
          </Link>

          <Link
            href="/activity"
            className="rounded-2xl border bg-white p-6 transition hover:border-slate-400 hover:shadow-sm"
          >
            <p className="text-lg font-medium text-slate-950">Activity</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review your personal academic progress history.
            </p>
          </Link>

          <Link
            href="/friends"
            className="rounded-2xl border bg-white p-6 transition hover:border-slate-400 hover:shadow-sm"
          >
            <p className="text-lg font-medium text-slate-950">Friends</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Connect with classmates and manage friend requests.
            </p>
          </Link>
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
