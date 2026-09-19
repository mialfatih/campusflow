export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  createCourse,
  createSemester,
  deleteCourse,
  setActiveSemester,
  updateCourse,
} from "./actions";

export default async function CoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: semesterData } = await supabase
    .from("semesters")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const semesters = semesterData ?? [];

  const activeSemester = semesters.find((semester) => semester.is_active);

  let courses: Array<{
    id: string;
    name: string;
    code: string | null;
  }> = [];

  if (activeSemester) {
    const { data } = await supabase
      .from("courses")
      .select("id, name, code")
      .eq("user_id", user.id)
      .eq("semester_id", activeSemester.id)
      .order("name");

    courses = data ?? [];
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight text-slate-950"
          >
            CampusFlow
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-blue-600">Academic Setup</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Semesters & Courses
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Organize your academic work by semester and course before adding
            assignments.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* LEFT SIDE */}
          <aside className="space-y-6">
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-950">
                Add semester
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                A newly created semester becomes your active semester
                automatically.
              </p>

              <form action={createSemester} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="semester-name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Semester name
                  </label>

                  <input
                    id="semester-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Semester 8"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="start-date"
                    className="text-sm font-medium text-slate-700"
                  >
                    Start date
                  </label>

                  <input
                    id="start-date"
                    name="start_date"
                    type="date"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="end-date"
                    className="text-sm font-medium text-slate-700"
                  >
                    End date
                  </label>

                  <input
                    id="end-date"
                    name="end_date"
                    type="date"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Create semester
                </button>
              </form>
            </section>

            {semesters.length > 0 && (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-950">
                  Your semesters
                </h2>

                <div className="mt-5 space-y-3">
                  {semesters.map((semester) => (
                    <div key={semester.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">
                            {semester.name}
                          </p>

                          {semester.is_active && (
                            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>

                        {!semester.is_active && (
                          <form action={setActiveSemester}>
                            <input
                              type="hidden"
                              name="semester_id"
                              value={semester.id}
                            />

                            <button
                              type="submit"
                              className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Set active
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          {/* RIGHT SIDE */}
          <section>
            {!activeSemester ? (
              <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
                <h2 className="text-xl font-semibold text-slate-950">
                  No active semester yet
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Create your first semester to start adding courses.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Active semester</p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                      {activeSemester.name}
                    </h2>
                  </div>

                  <p className="text-sm text-slate-500">
                    {courses.length}{" "}
                    {courses.length === 1 ? "course" : "courses"}
                  </p>
                </div>

                <form
                  action={createCourse}
                  className="mt-6 rounded-2xl border bg-white p-6"
                >
                  <input
                    type="hidden"
                    name="semester_id"
                    value={activeSemester.id}
                  />

                  <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
                    <div>
                      <label
                        htmlFor="course-name"
                        className="text-sm font-medium text-slate-700"
                      >
                        Course name
                      </label>

                      <input
                        id="course-name"
                        name="name"
                        type="text"
                        required
                        placeholder="Database Systems"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="course-code"
                        className="text-sm font-medium text-slate-700"
                      >
                        Course code
                      </label>

                      <input
                        id="course-code"
                        name="code"
                        type="text"
                        placeholder="DBS401"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Add course
                    </button>
                  </div>
                </form>

                {courses.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed bg-white p-10 text-center">
                    <h3 className="font-medium text-slate-950">
                      No courses yet
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Add the courses you are taking this semester.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {courses.map((course) => (
                      <article
                        key={course.id}
                        className="rounded-2xl border bg-white p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                              {course.code || "No course code"}
                            </p>

                            <h3 className="mt-2 text-lg font-semibold text-slate-950">
                              {course.name}
                            </h3>
                          </div>
                        </div>

                        <details className="mt-6">
                          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-950">
                            Edit course
                          </summary>

                          <form
                            action={updateCourse}
                            className="mt-4 space-y-3"
                          >
                            <input
                              type="hidden"
                              name="course_id"
                              value={course.id}
                            />

                            <input
                              name="name"
                              type="text"
                              required
                              defaultValue={course.name}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950"
                            />

                            <input
                              name="code"
                              type="text"
                              defaultValue={course.code ?? ""}
                              placeholder="Course code"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950"
                            />

                            <button
                              type="submit"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Save changes
                            </button>
                          </form>
                        </details>

                        <form
                          action={deleteCourse}
                          className="mt-4 border-t pt-4"
                        >
                          <input
                            type="hidden"
                            name="course_id"
                            value={course.id}
                          />

                          <button
                            type="submit"
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Delete course
                          </button>
                        </form>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
