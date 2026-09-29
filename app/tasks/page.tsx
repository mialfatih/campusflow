export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";

import { createTask, moveTaskUp, updateTask } from "./actions";

import { DeleteTaskForm } from "./delete-task-form";

import { DraggableTask, KanbanBoard, KanbanColumn } from "./kanban-board";

type Course = {
  id: string;
  name: string;
  code: string | null;
  course_space_id: string | null;
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

  /* =========================================================
     ACTIVE SEMESTER
  ========================================================= */

  const { data: activeSemester, error: semesterError } = await supabase
    .from("semesters")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (semesterError) {
    throw new Error(semesterError.message);
  }

  /* =========================================================
     COURSES
  ========================================================= */

  let courses: Course[] = [];

  if (activeSemester) {
    const { data, error: coursesError } = await supabase
      .from("courses")
      .select(
        `
        id,
        name,
        code,
        course_space_id
      `,
      )
      .eq("user_id", user.id)
      .eq("semester_id", activeSemester.id)
      .order("name");

    if (coursesError) {
      throw new Error(coursesError.message);
    }

    courses = (data ?? []) as Course[];
  }

  const courseIds = courses.map((course) => course.id);

  /* =========================================================
     TASKS
  ========================================================= */

  let tasks: Task[] = [];

  if (courseIds.length > 0) {
    const { data, error: tasksError } = await supabase
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

    if (tasksError) {
      throw new Error(tasksError.message);
    }

    tasks = (data ?? []) as Task[];
  }

  /* =========================================================
     TASK GROUPS
  ========================================================= */

  const taskGroups = {
    todo: tasks.filter((task) => task.status === "todo"),

    in_progress: tasks.filter((task) => task.status === "in_progress"),

    review: tasks.filter((task) => task.status === "review"),

    submitted: tasks.filter((task) => task.status === "submitted"),
  };

  const activeTasks = taskGroups.in_progress.length + taskGroups.review.length;

  const needHelpCount = tasks.filter((task) => task.need_help).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Assignments</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Academic Tasks
            </h1>

            <p className="mt-2 text-slate-600">
              {activeSemester
                ? `${activeSemester.name} · ${tasks.length} ${
                    tasks.length === 1 ? "assignment" : "assignments"
                  }`
                : "Create an active semester before adding assignments."}
            </p>
          </div>

          {activeSemester && courses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/courses"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Manage courses
              </Link>

              <Link
                href="/course-spaces"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Course Spaces
              </Link>
            </div>
          )}
        </div>

        {/* =================================================
            NO ACTIVE SEMESTER
        ================================================== */}

        {!activeSemester ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-950">
              No active semester
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create or activate a semester before adding assignments.
            </p>

            <Link
              href="/courses"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Manage semesters
            </Link>
          </div>
        ) : courses.length === 0 ? (
          /* =================================================
             NO COURSES
          ================================================== */

          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-950">
              No courses in this semester
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add at least one course before creating assignments.
            </p>

            <Link
              href="/courses"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Add courses
            </Link>
          </div>
        ) : (
          <>
            {/* =============================================
                SUMMARY
            ============================================== */}

            <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard label="To Do" value={taskGroups.todo.length} />

              <SummaryCard
                label="In Progress"
                value={taskGroups.in_progress.length}
              />

              <SummaryCard label="Review" value={taskGroups.review.length} />

              <SummaryCard
                label="Submitted"
                value={taskGroups.submitted.length}
              />

              <SummaryCard
                label="Need Help"
                value={needHelpCount}
                highlight={needHelpCount > 0}
              />
            </section>

            {/* =============================================
                ADD ASSIGNMENT
            ============================================== */}

            <details className="group mt-8 overflow-hidden rounded-2xl border bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 [&::-webkit-details-marker]:hidden">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Add assignment
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a new task. New assignments start in To Do.
                  </p>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl font-light text-slate-500 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t px-6 py-6">
                <form action={createTask} className="grid gap-5 lg:grid-cols-2">
                  {/* COURSE */}

                  <div>
                    <label
                      htmlFor="new-task-course"
                      className="text-sm font-medium text-slate-700"
                    >
                      Course
                    </label>

                    <select
                      id="new-task-course"
                      name="course_id"
                      required
                      defaultValue=""
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    >
                      <option value="" disabled>
                        Select course
                      </option>

                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code
                            ? `${course.code} · ${course.name}`
                            : course.name}

                          {!course.course_space_id ? " · No Course Space" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TITLE */}

                  <div>
                    <label
                      htmlFor="new-task-title"
                      className="text-sm font-medium text-slate-700"
                    >
                      Assignment title
                    </label>

                    <input
                      id="new-task-title"
                      name="title"
                      type="text"
                      required
                      placeholder="Machine Learning Report"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="lg:col-span-2">
                    <label
                      htmlFor="new-task-description"
                      className="text-sm font-medium text-slate-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="new-task-description"
                      name="description"
                      rows={3}
                      placeholder="What needs to be completed?"
                      className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    />
                  </div>

                  {/* DEADLINE */}

                  <div>
                    <label
                      htmlFor="new-task-deadline"
                      className="text-sm font-medium text-slate-700"
                    >
                      Deadline
                    </label>

                    <input
                      id="new-task-deadline"
                      name="due_date"
                      type="date"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    />
                  </div>

                  {/* PRIORITY */}

                  <div>
                    <label
                      htmlFor="new-task-priority"
                      className="text-sm font-medium text-slate-700"
                    >
                      Priority
                    </label>

                    <select
                      id="new-task-priority"
                      name="priority"
                      defaultValue="medium"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    >
                      <option value="low">Low</option>

                      <option value="medium">Medium</option>

                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* VISIBILITY */}

                  <div>
                    <label
                      htmlFor="new-task-visibility"
                      className="text-sm font-medium text-slate-700"
                    >
                      Visibility
                    </label>

                    <select
                      id="new-task-visibility"
                      name="visibility"
                      defaultValue="private"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                    >
                      <option value="private">Private</option>

                      <option value="friends">Friends</option>

                      <option value="course">Course</option>
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Course visibility is shared only with members of the same
                      Course Space. If the selected course is not linked to a
                      Course Space, the task remains visible only to you.
                    </p>
                  </div>

                  {/* SUBMIT */}

                  <div className="flex items-end">
                    <SubmitButton
                      pendingText="Adding..."
                      className="w-full rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Add assignment
                    </SubmitButton>
                  </div>
                </form>
              </div>
            </details>

            {/* =============================================
                BOARD HEADER
            ============================================== */}

            <section className="mt-10">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Task board
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Drag assignments between stages as your work progresses.
                  </p>
                </div>

                {activeTasks > 0 && (
                  <p className="text-sm text-slate-400">
                    {activeTasks}{" "}
                    {activeTasks === 1
                      ? "active assignment"
                      : "active assignments"}
                  </p>
                )}
              </div>

              {/* ===========================================
                  KANBAN
              ============================================ */}

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

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-amber-200 bg-amber-50" : "bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          highlight ? "text-amber-700" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          highlight ? "text-amber-900" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TASK CARD
========================================================= */

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

  const visibilityBadgeStyle: Record<string, string> = {
    private: "bg-slate-100 text-slate-600",

    friends: "bg-emerald-50 text-emerald-700",

    course: "bg-blue-50 text-blue-700",
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        priorityCardStyle[task.priority] ?? ""
      }`}
    >
      {/* ===============================================
          TASK HEADER
      ================================================ */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {courseCode ? `${courseCode} · ${courseName}` : courseName}
          </p>

          <Link
            href={`/tasks/${task.id}`}
            className="mt-2 block font-semibold leading-6 text-slate-950 transition hover:text-blue-600"
          >
            {task.title}
          </Link>
        </div>

        {task.need_help && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Need Help
          </span>
        )}
      </div>

      {/* DESCRIPTION */}

      {task.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
          {task.description}
        </p>
      )}

      {/* ===============================================
          PROGRESS
      ================================================ */}

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Progress</span>

          <span className="font-medium text-slate-700">{task.progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900"
            style={{
              width: `${Math.min(Math.max(task.progress, 0), 100)}%`,
            }}
          />
        </div>
      </div>

      {/* ===============================================
          META
      ================================================ */}

      <div className="mt-5 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            priorityBadgeStyle[task.priority] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {priorityLabels[task.priority] ?? task.priority} priority
        </span>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {formatDate(task.due_at)}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            visibilityBadgeStyle[task.visibility] ??
            "bg-slate-100 text-slate-600"
          }`}
        >
          {task.visibility}
        </span>
      </div>

      {/* ===============================================
          QUICK ACTIONS
      ================================================ */}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <form action={moveTaskUp}>
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
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Open details →
        </Link>
      </div>

      {/* ===============================================
          EDIT ASSIGNMENT
      ================================================ */}

      <details className="mt-5 border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-950">
          Edit assignment
        </summary>

        <form action={updateTask} className="mt-4 space-y-4">
          <input type="hidden" name="task_id" value={task.id} />

          {/* COURSE */}

          <div>
            <label className="text-xs font-medium text-slate-500">Course</label>

            <select
              name="course_id"
              defaultValue={task.course_id}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code
                    ? `${course.code} · ${course.name}`
                    : course.name}
                </option>
              ))}
            </select>
          </div>

          {/* TITLE */}

          <div>
            <label className="text-xs font-medium text-slate-500">Title</label>

            <input
              name="title"
              defaultValue={task.title}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="text-xs font-medium text-slate-500">
              Description
            </label>

            <textarea
              name="description"
              defaultValue={task.description ?? ""}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950"
            />
          </div>

          {/* DEADLINE */}

          <div>
            <label className="text-xs font-medium text-slate-500">
              Deadline
            </label>

            <input
              name="due_date"
              type="date"
              defaultValue={toDateInput(task.due_at)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950"
            />
          </div>

          {/* STATUS */}

          <div>
            <label className="text-xs font-medium text-slate-500">Status</label>

            <select
              name="status"
              defaultValue={task.status}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            >
              <option value="todo">To Do</option>

              <option value="in_progress">In Progress</option>

              <option value="review">Review</option>

              <option value="submitted">Submitted</option>
            </select>
          </div>

          {/* PROGRESS */}

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
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950"
            />
          </div>

          {/* PRIORITY + VISIBILITY */}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">
                Priority
              </label>

              <select
                name="priority"
                defaultValue={task.priority}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
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
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
              >
                <option value="private">Private</option>

                <option value="friends">Friends</option>

                <option value="course">Course</option>
              </select>
            </div>
          </div>

          {/* NEED HELP */}

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              name="need_help"
              type="checkbox"
              defaultChecked={task.need_help}
              className="mt-1"
            />

            <span>I need help with this assignment</span>
          </label>

          <SubmitButton
            pendingText="Saving..."
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Save changes
          </SubmitButton>
        </form>
      </details>

      {/* ===============================================
          DELETE
      ================================================ */}

      <div className="mt-4">
        <DeleteTaskForm taskId={task.id} taskTitle={task.title} />
      </div>
    </article>
  );
}
