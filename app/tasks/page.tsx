export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { createTask, deleteTask, moveTaskUp, updateTask } from "./actions";

import { AppHeader } from "@/components/app-header";

import { DraggableTask, KanbanBoard, KanbanColumn } from "./kanban-board";

type Course = {
  id: string;
  name: string;
  code: string | null;
};

type Task = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
  priority: string;
  progress: number;
  need_help: boolean;
  visibility: string;
  position: number;
  courses:
    | {
        name: string;
        code: string | null;
      }
    | {
        name: string;
        code: string | null;
      }[]
    | null;
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function getCourseName(task: Task) {
  if (Array.isArray(task.courses)) {
    return task.courses[0]?.name ?? "Unknown course";
  }

  return task.courses?.name ?? "Unknown course";
}

function getCourseCode(task: Task) {
  if (Array.isArray(task.courses)) {
    return task.courses[0]?.code ?? null;
  }

  return task.courses?.code ?? null;
}

function formatDate(date: string | null) {
  if (!date) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(date));
}

function toDateInput(date: string | null) {
  if (!date) {
    return "";
  }

  return date.slice(0, 10);
}

export default async function TasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  let courses: Course[] = [];

  if (activeSemester) {
    const { data } = await supabase
      .from("courses")
      .select("id, name, code")
      .eq("user_id", user.id)
      .eq("semester_id", activeSemester.id)
      .order("name");

    courses = data ?? [];
  }

  const courseIds = courses.map((course) => course.id);

  let tasks: Task[] = [];

  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select(
        `
        id,
        course_id,
        title,
        description,
        due_at,
        status,
        priority,
        progress,
        need_help,
        visibility,
        position,
        courses (
          name,
          code
        )
      `,
      )
      .eq("user_id", user.id)
      .in("course_id", courseIds)
      .order("position", {
        ascending: true,
      });

    tasks = (data ?? []) as Task[];
  }

  const taskGroups = {
    todo: tasks.filter((task) => task.status === "todo"),
    in_progress: tasks.filter((task) => task.status === "in_progress"),
    review: tasks.filter((task) => task.status === "review"),
    submitted: tasks.filter((task) => task.status === "submitted"),
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Assignments</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Academic Tasks
            </h1>

            <p className="mt-2 text-slate-600">
              {activeSemester
                ? `${activeSemester.name} · ${tasks.length} tasks`
                : "Create an active semester before adding tasks."}
            </p>
          </div>
        </div>

        {!activeSemester ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-950">
              No active semester
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create or activate a semester first.
            </p>

            <Link
              href="/courses"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white"
            >
              Manage semesters
            </Link>
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-950">
              No courses in this semester
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add at least one course before creating assignments.
            </p>

            <Link
              href="/courses"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white"
            >
              Add courses
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-10 rounded-2xl border bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Add assignment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  New assignments start in the To Do stage.
                </p>
              </div>

              <form
                action={createTask}
                className="mt-6 grid gap-4 lg:grid-cols-2"
              >
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Course
                  </label>

                  <select
                    name="course_id"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950"
                  >
                    <option value="">Select course</option>

                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code
                          ? `${course.code} · ${course.name}`
                          : course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Assignment title
                  </label>

                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Machine Learning Report"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    rows={3}
                    placeholder="What needs to be completed?"
                    className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Deadline
                  </label>

                  <input
                    name="due_date"
                    type="date"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    name="priority"
                    defaultValue="medium"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950"
                  >
                    <option value="low">Low</option>

                    <option value="medium">Medium</option>

                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Visibility
                  </label>

                  <select
                    name="visibility"
                    defaultValue="private"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950"
                  >
                    <option value="private">Private</option>

                    <option value="friends">Friends</option>

                    <option value="course">Course</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Add assignment
                  </button>
                </div>
              </form>
            </section>

            <section className="mt-10">
              <KanbanBoard>
                {(["todo", "in_progress", "review", "submitted"] as const).map(
                  (status) => {
                    const statusTasks = taskGroups[status];

                    return (
                      <KanbanColumn
                        key={status}
                        id={status}
                        title={statusLabels[status]}
                        count={statusTasks.length}
                      >
                        {statusTasks.length === 0 ? (
                          <div className="rounded-2xl border border-dashed bg-white p-5 text-center text-sm text-slate-400">
                            Drop assignment here
                          </div>
                        ) : (
                          statusTasks.map((task, index) => (
                            <DraggableTask
                              key={task.id}
                              id={task.id}
                              status={task.status}
                            >
                              <TaskCard
                                task={task}
                                courses={courses}
                                canMoveUp={index > 0}
                              />
                            </DraggableTask>
                          ))
                        )}
                      </KanbanColumn>
                    );
                  },
                )}
              </KanbanBoard>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function TaskCard({
  task,
  courses,
  canMoveUp,
}: {
  task: Task;
  courses: Course[];
  canMoveUp: boolean;
}) {
  const courseName = getCourseName(task);
  const courseCode = getCourseCode(task);

  const priorityCardStyle: Record<string, string> = {
    high: "border-l-4 border-l-rose-500",
    medium: "border-l-4 border-l-amber-400",
    low: "border-l-4 border-l-slate-300",
  };

  const priorityBadgeStyle: Record<string, string> = {
    high: "bg-rose-50 text-rose-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        priorityCardStyle[task.priority] ?? ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {courseCode ? `${courseCode} · ${courseName}` : courseName}
          </p>

          <Link
            href={`/tasks/${task.id}`}
            className="mt-2 block font-semibold leading-6 text-slate-950 hover:text-blue-600"
          >
            {task.title}
          </Link>
        </div>

        {task.need_help && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Need Help
          </span>
        )}
      </div>

      {task.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
          {task.description}
        </p>
      )}

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Progress</span>

          <span className="font-medium text-slate-700">{task.progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900"
            style={{
              width: `${task.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            priorityBadgeStyle[task.priority] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {priorityLabels[task.priority]} priority
        </span>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {formatDate(task.due_at)}
        </span>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
          {task.visibility}
        </span>
      </div>

      <form action={moveTaskUp} className="mt-4">
        <input type="hidden" name="task_id" value={task.id} />

        <button
          type="submit"
          disabled={!canMoveUp}
          className={`text-xs font-medium ${
            canMoveUp
              ? "text-slate-500 hover:text-slate-950"
              : "cursor-not-allowed text-slate-300"
          }`}
        >
          Move up
        </button>
      </form>

      <Link
        href={`/tasks/${task.id}`}
        className="mt-5 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Open details →
      </Link>

      <details className="mt-5 border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-950">
          Edit assignment
        </summary>

        <form action={updateTask} className="mt-4 space-y-3">
          <input type="hidden" name="task_id" value={task.id} />

          <div>
            <label className="text-xs font-medium text-slate-500">Course</label>

            <select
              name="course_id"
              defaultValue={task.course_id}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Title</label>

            <input
              name="title"
              defaultValue={task.title}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">
              Description
            </label>

            <textarea
              name="description"
              defaultValue={task.description ?? ""}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">
              Deadline
            </label>

            <input
              name="due_date"
              type="date"
              defaultValue={toDateInput(task.due_at)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Status</label>

            <select
              name="status"
              defaultValue={task.status}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="todo">To Do</option>

              <option value="in_progress">In Progress</option>

              <option value="review">Review</option>

              <option value="submitted">Submitted</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">
              Manual progress: {task.progress}%
            </label>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Used only when this assignment has no checklist. Checklist
              progress is calculated automatically.
            </p>

            <input
              name="progress"
              type="number"
              min="0"
              max="100"
              defaultValue={task.progress}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">
                Priority
              </label>

              <select
                name="priority"
                defaultValue={task.priority}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="low">Low</option>

                <option value="medium">Medium</option>

                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Visibility
              </label>

              <select
                name="visibility"
                defaultValue={task.visibility}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="private">Private</option>

                <option value="friends">Friends</option>

                <option value="course">Course</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              name="need_help"
              type="checkbox"
              defaultChecked={task.need_help}
            />
            I need help with this assignment
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            Save changes
          </button>
        </form>
      </details>

      <form action={deleteTask} className="mt-4">
        <input type="hidden" name="task_id" value={task.id} />

        <button
          type="submit"
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          Delete assignment
        </button>
      </form>
    </article>
  );
}
