export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /* =========================================================
     PROFILE
  ========================================================= */

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, university, major")
    .eq("id", user.id)
    .maybeSingle();

  /* =========================================================
     ACTIVE SEMESTER
  ========================================================= */

  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  /* =========================================================
     ACTIVE COURSES
  ========================================================= */

  let activeCourseIds: string[] = [];
  let activeCourseCount = 0;

  if (activeSemester) {
    const { data: activeCourses } = await supabase
      .from("courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("semester_id", activeSemester.id);

    activeCourseIds = activeCourses?.map((course) => course.id) ?? [];

    activeCourseCount = activeCourseIds.length;
  }

  /* =========================================================
     DASHBOARD STATISTICS
  ========================================================= */

  const [totalResult, todoResult, progressResult, submittedResult] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "todo"),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "in_progress"),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("status", "submitted"),
    ]);

  /* =========================================================
     ONBOARDING STATE
  ========================================================= */

  let activeTaskCount = 0;
  let startedTaskCount = 0;

  if (activeCourseIds.length > 0) {
    const [activeTasksResult, startedTasksResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .in("course_id", activeCourseIds),

      supabase
        .from("tasks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .in("course_id", activeCourseIds)
        .in("status", ["in_progress", "review", "submitted"]),
    ]);

    activeTaskCount = activeTasksResult.count ?? 0;

    startedTaskCount = startedTasksResult.count ?? 0;
  }

  const onboardingSteps = [
    {
      title: "Create your semester",
      description: "Set up the semester you are currently working in.",
      href: "/courses",
      action: "Set up semester",
      done: Boolean(activeSemester),
    },
    {
      title: "Add your courses",
      description: "Organize assignments around the classes you are taking.",
      href: "/courses",
      action: "Add courses",
      done: Boolean(activeSemester) && activeCourseCount > 0,
    },
    {
      title: "Add your first assignment",
      description:
        "Create a task and give it a deadline, priority, and visibility.",
      href: "/tasks",
      action: "Add assignment",
      done: activeTaskCount > 0,
    },
    {
      title: "Start tracking progress",
      description: "Move an assignment forward as you begin working on it.",
      href: "/tasks",
      action: "Open task board",
      done: startedTaskCount > 0,
    },
  ];

  const completedSteps = onboardingSteps.filter((step) => step.done).length;

  const firstIncompleteIndex = onboardingSteps.findIndex((step) => !step.done);

  const onboardingComplete = firstIncompleteIndex === -1;

  const onboardingPercentage = (completedSteps / onboardingSteps.length) * 100;

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* =================================================
            INTRO
        ================================================== */}

        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Dashboard</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Welcome, {profile?.full_name ?? user.email}
            </h1>

            <p className="mt-2 text-slate-600">
              Here is your academic progress.
            </p>

            {(profile?.major || profile?.university) && (
              <p className="mt-2 text-sm text-slate-400">
                {[profile.major, profile.university]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          {activeSemester && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span>Active semester:</span>

              <span className="font-medium text-slate-950">
                {activeSemester.name}
              </span>
            </div>
          )}
        </section>

        {/* =================================================
            ONBOARDING
        ================================================== */}

        {!onboardingComplete ? (
          <section className="mt-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-sm">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.72fr_1.28fr] lg:p-10">
              {/* LEFT */}

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">
                  Getting started
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Set up your academic workspace.
                </h2>

                <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
                  CampusFlow becomes more useful as you add your semester,
                  courses, and assignments.
                </p>

                {/* PROGRESS */}

                <div className="mt-8">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Setup progress</span>

                    <span className="font-medium text-white">
                      {completedSteps} of {onboardingSteps.length}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${onboardingPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  You can always manage semesters and courses from the Courses
                  page.
                </p>
              </div>

              {/* STEPS */}

              <div className="space-y-3">
                {onboardingSteps.map((step, index) => {
                  const current = index === firstIncompleteIndex;

                  return (
                    <div
                      key={step.title}
                      className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                        step.done
                          ? "border-slate-800 bg-slate-900/40"
                          : current
                            ? "border-blue-500/40 bg-blue-500/10"
                            : "border-slate-800 bg-slate-900/20"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            step.done
                              ? "bg-emerald-400/10 text-emerald-400"
                              : current
                                ? "bg-blue-500 text-white"
                                : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {step.done ? <CheckIcon /> : index + 1}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm font-semibold ${
                                step.done ? "text-slate-300" : "text-white"
                              }`}
                            >
                              {step.title}
                            </h3>

                            {current && (
                              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-300">
                                Next
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {step.done ? (
                        <span className="pl-13 text-xs font-medium text-emerald-400 sm:pl-0">
                          Complete
                        </span>
                      ) : current ? (
                        <Link
                          href={step.href}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
                        >
                          {step.action} →
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-600">Upcoming</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-10 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckIcon />
              </div>

              <div>
                <p className="font-semibold text-emerald-950">
                  Your workspace is ready.
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  Your semester, courses, and task workflow are set up.
                </p>
              </div>
            </div>

            <Link
              href="/tasks"
              className="inline-flex shrink-0 text-sm font-medium text-emerald-800 hover:text-emerald-950"
            >
              Continue working →
            </Link>
          </section>
        )}

        {/* =================================================
            STATISTICS
        ================================================== */}

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Overview</h2>

            <p className="mt-1 text-sm text-slate-500">
              A quick look at your assignment progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard label="Total Tasks" value={totalResult.count ?? 0} />

            <DashboardCard label="To Do" value={todoResult.count ?? 0} />

            <DashboardCard
              label="In Progress"
              value={progressResult.count ?? 0}
            />

            <DashboardCard
              label="Submitted"
              value={submittedResult.count ?? 0}
            />
          </div>
        </section>

        {/* =================================================
            PRIMARY ACTIONS
        ================================================== */}

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
              className="group rounded-2xl border bg-white p-7 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-slate-950">Tasks</p>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Track assignments, deadlines, progress, checklists, and move
                    work through your Kanban workflow.
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
                  <TasksIcon />
                </div>
              </div>

              <p className="mt-6 text-sm font-medium text-blue-600">
                Open assignments →
              </p>
            </Link>

            <Link
              href="/feed"
              className="group rounded-2xl border bg-white p-7 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold text-slate-950">Feed</p>

                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-700">
                      Social
                    </span>
                  </div>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Follow meaningful academic progress from friends and
                    classmates without manual social posts.
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
                  <FeedIcon />
                </div>
              </div>

              <p className="mt-6 text-sm font-medium text-blue-600">
                View progress feed →
              </p>
            </Link>
          </div>
        </section>

        {/* =================================================
            SECONDARY ACTIONS
        ================================================== */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/courses"
            className="rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
          >
            <p className="text-lg font-medium text-slate-950">Courses</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage semesters, personal courses, and Course Spaces.
            </p>
          </Link>

          <Link
            href="/activity"
            className="rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
          >
            <p className="text-lg font-medium text-slate-950">Activity</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review your personal academic progress history.
            </p>
          </Link>

          <Link
            href="/friends"
            className="rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
          >
            <p className="text-lg font-medium text-slate-950">Friends</p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Connect with classmates and manage friend requests.
            </p>
          </Link>
        </section>

        {/* =================================================
            QUICK GUIDE
        ================================================== */}

        <section className="mt-12 border-t border-slate-200 pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Quick guide</p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                How sharing works
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                You decide who can see each assignment. CampusFlow does not make
                your academic progress public by default.
              </p>
            </div>

            <Link
              href="/course-spaces"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Explore Course Spaces →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GuideCard
              label="Private"
              title="Only you"
              description="The assignment and its progress stay visible only to your account."
            />

            <GuideCard
              label="Friends"
              title="Accepted friends"
              description="Share selected work with people you have connected with on CampusFlow."
            />

            <GuideCard
              label="Course"
              title="Your exact class"
              description="Share with members of the Course Space connected to that course."
            />

            <GuideCard
              label="Need Help"
              title="Ask with context"
              description="On a shareable assignment, eligible classmates can offer support and enter a focused Help Room if accepted."
            />
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">
                i
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-950">
                  Course Spaces are optional.
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Your personal course and assignments work without one. Create
                  or join a Course Space when you want to share Course-visible
                  progress with a specific class.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

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

function GuideCard({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border bg-white p-5">
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        {label}
      </span>

      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m5 10 3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="m6.5 8 1.5 1.5 2.5-3M6.5 13h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 5h10M5 10h7M5 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
