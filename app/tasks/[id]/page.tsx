export const instant = false;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  createChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} from "./actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string | null) {
  if (!date) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    submitted: "Submitted",
  };

  return labels[status] ?? status;
}

export default async function TaskDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      due_at,
      status,
      priority,
      progress,
      need_help,
      visibility,
      submitted_at,
      courses (
        name,
        code
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !task) {
    notFound();
  }

  const { data: checklistData } =
    await supabase
      .from("task_checklist_items")
      .select(`
        id,
        content,
        is_done,
        position
      `)
      .eq("task_id", id)
      .order("position");

  const checklist = checklistData ?? [];

  const completedItems = checklist.filter(
    (item) => item.is_done,
  ).length;

  const rawCourse = task.courses;

  const course = Array.isArray(rawCourse)
    ? rawCourse[0]
    : rawCourse;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight text-slate-950"
          >
            CampusFlow
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/tasks"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Assignments
            </Link>

            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/tasks"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Back to assignments
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* MAIN */}
          <section>
            <div className="rounded-2xl border bg-white p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {course?.code
                      ? `${course.code} · ${course.name}`
                      : course?.name ??
                        "Course"}
                  </p>

                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {task.title}
                  </h1>

                  {task.description && (
                    <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                      {task.description}
                    </p>
                  )}
                </div>

                {task.need_help && (
                  <span className="self-start rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                    Need Help
                  </span>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Assignment progress
                  </p>

                  <p className="text-sm font-semibold text-slate-950">
                    {task.progress}%
                  </p>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-950 transition-all"
                    style={{
                      width: `${task.progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CHECKLIST */}
            <div className="mt-6 rounded-2xl border bg-white p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    Checklist
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Break the assignment into smaller
                    steps.
                  </p>
                </div>

                {checklist.length > 0 && (
                  <p className="text-sm font-medium text-slate-500">
                    {completedItems} /{" "}
                    {checklist.length} completed
                  </p>
                )}
              </div>

              <form
                action={createChecklistItem}
                className="mt-6 flex gap-3"
              >
                <input
                  type="hidden"
                  name="task_id"
                  value={task.id}
                />

                <input
                  name="content"
                  required
                  placeholder="Add a checklist item..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                />

                <button
                  type="submit"
                  className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Add
                </button>
              </form>

              {checklist.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No checklist items yet.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Add the steps required to finish this
                    assignment.
                  </p>
                </div>
              ) : (
                <div className="mt-6 divide-y">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-4"
                    >
                      <form
                        action={
                          toggleChecklistItem
                        }
                      >
                        <input
                          type="hidden"
                          name="task_id"
                          value={task.id}
                        />

                        <input
                          type="hidden"
                          name="item_id"
                          value={item.id}
                        />

                        <input
                          type="hidden"
                          name="is_done"
                          value={String(
                            item.is_done,
                          )}
                        />

                        <button
                          type="submit"
                          aria-label={
                            item.is_done
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                          className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold transition ${
                            item.is_done
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-slate-500"
                          }`}
                        >
                          ✓
                        </button>
                      </form>

                      <p
                        className={`min-w-0 flex-1 text-sm ${
                          item.is_done
                            ? "text-slate-400 line-through"
                            : "text-slate-700"
                        }`}
                      >
                        {item.content}
                      </p>

                      <form
                        action={
                          deleteChecklistItem
                        }
                      >
                        <input
                          type="hidden"
                          name="task_id"
                          value={task.id}
                        />

                        <input
                          type="hidden"
                          name="item_id"
                          value={item.id}
                        />

                        <button
                          type="submit"
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-5">
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold text-slate-950">
                Assignment details
              </h2>

              <dl className="mt-5 space-y-5">
                <DetailItem
                  label="Status"
                  value={statusLabel(task.status)}
                />

                <DetailItem
                  label="Deadline"
                  value={formatDate(task.due_at)}
                />

                <DetailItem
                  label="Priority"
                  value={
                    task.priority
                      .charAt(0)
                      .toUpperCase() +
                    task.priority.slice(1)
                  }
                />

                <DetailItem
                  label="Visibility"
                  value={
                    task.visibility
                      .charAt(0)
                      .toUpperCase() +
                    task.visibility.slice(1)
                  }
                />

                <DetailItem
                  label="Need Help"
                  value={
                    task.need_help
                      ? "Yes"
                      : "No"
                  }
                />
              </dl>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold text-slate-950">
                Checklist progress
              </h2>

              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {completedItems}
                <span className="text-lg font-normal text-slate-400">
                  {" "}
                  / {checklist.length}
                </span>
              </p>

              <p className="mt-2 text-sm text-slate-500">
                checklist items completed
              </p>
            </div>

            <Link
              href="/tasks"
              className="block rounded-2xl border bg-white p-6 transition hover:border-slate-400"
            >
              <p className="font-medium text-slate-950">
                Edit assignment
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Change status, deadline, priority,
                visibility, or help status from the
                assignment board.
              </p>
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}