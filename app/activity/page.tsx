export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";

import { createClient } from "@/lib/supabase/server";

type CourseInfo = {
  name: string;
  code: string | null;
};

type TaskInfo = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  courses: CourseInfo | CourseInfo[] | null;
};

type Activity = {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  tasks: TaskInfo | TaskInfo[] | null;
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
};

function getTask(activity: Activity): TaskInfo | null {
  if (Array.isArray(activity.tasks)) {
    return activity.tasks[0] ?? null;
  }

  return activity.tasks ?? null;
}

function getCourse(task: TaskInfo | null): CourseInfo | null {
  if (!task) {
    return null;
  }

  if (Array.isArray(task.courses)) {
    return task.courses[0] ?? null;
  }

  return task.courses ?? null;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function ActivityMessage({ activity }: { activity: Activity }) {
  const task = getTask(activity);

  if (!task) {
    return <span>Assignment activity</span>;
  }

  const title = (
    <Link
      href={`/tasks/${task.id}`}
      className="font-semibold text-slate-950 hover:text-blue-600"
    >
      {task.title}
    </Link>
  );

  if (activity.type === "task_created") {
    return <>Created {title}</>;
  }

  if (activity.type === "task_submitted") {
    return <>Submitted {title}</>;
  }

  if (activity.type === "need_help_requested") {
    return <>Needs help with {title}</>;
  }

  if (activity.type === "need_help_resolved") {
    return <>No longer needs help with {title}</>;
  }

  if (activity.type === "status_changed") {
    const fromStatus = String(activity.metadata?.from_status ?? "");

    const toStatus = String(activity.metadata?.to_status ?? "");

    return (
      <>
        Moved {title}
        <span className="block mt-1 text-sm text-slate-500">
          {statusLabels[fromStatus] ?? fromStatus}
          {" → "}
          {statusLabels[toStatus] ?? toStatus}
        </span>
      </>
    );
  }

  return <>Updated {title}</>;
}

function ActivityIndicator({ type }: { type: string }) {
  let className = "bg-slate-200";

  if (type === "task_created") {
    className = "bg-blue-500";
  }

  if (type === "status_changed") {
    className = "bg-violet-500";
  }

  if (type === "task_submitted") {
    className = "bg-emerald-500";
  }

  if (type === "need_help_requested") {
    className = "bg-amber-500";
  }

  if (type === "need_help_resolved") {
    className = "bg-slate-400";
  }

  return <div className={`mt-2 h-3 w-3 shrink-0 rounded-full ${className}`} />;
}

export default async function ActivityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data } = await supabase
    .from("activities")
    .select(
      `
      id,
      type,
      metadata,
      created_at,
      tasks (
        id,
        title,
        status,
        visibility,
        courses (
          name,
          code
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  const activities = (data ?? []) as Activity[];

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-blue-600">Progress History</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Activity
          </h1>

          <p className="mt-2 text-slate-600">
            A timeline of meaningful changes across your academic work.
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="font-semibold text-slate-950">No activity yet</h2>

            <p className="mt-2 text-sm text-slate-500">
              Create or update an assignment to start building your progress
              history.
            </p>

            <Link
              href="/tasks"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white"
            >
              View assignments
            </Link>
          </div>
        ) : (
          <div className="mt-10">
            {activities.map((activity, index) => {
              const task = getTask(activity);

              const course = getCourse(task);

              return (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex w-4 flex-col items-center">
                    <ActivityIndicator type={activity.type} />

                    {index < activities.length - 1 && (
                      <div className="mt-2 h-full w-px bg-slate-200" />
                    )}
                  </div>

                  <div className="pb-8">
                    <div className="rounded-2xl border bg-white px-5 py-4">
                      {course && (
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                          {course.code
                            ? `${course.code} · ${course.name}`
                            : course.name}
                        </p>
                      )}

                      <div className="text-sm leading-6 text-slate-700">
                        <ActivityMessage activity={activity} />
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
