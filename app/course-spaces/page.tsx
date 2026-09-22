export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

import { createCourseSpace, joinCourseSpace } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

type Course = {
  id: string;
  name: string;
  code: string | null;
  course_space_id: string | null;
};

type CourseSpaceInfo = {
  id: string;
  name: string;
  code: string | null;
  invite_code: string;
};

type SpaceMembership = {
  role: string;

  course_space: CourseSpaceInfo | CourseSpaceInfo[] | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

const errorMessages: Record<string, string> = {
  "invalid-invite":
    "Course Space not found. Check the invite code and try again.",

  "already-member": "You are already a member of this Course Space.",

  "course-linked":
    "The selected personal course is already connected to a Course Space.",

  "course-code-mismatch":
    "The selected course code does not match this Course Space.",

  "course-not-found": "The selected personal course could not be found.",

  "invite-required": "Enter a Course Space invite code.",

  "select-course": "Select a personal course first.",

  "create-failed":
    "CampusFlow could not create the Course Space. Please try again.",

  "join-failed":
    "CampusFlow could not join the Course Space. Please try again.",

  "owner-cannot-leave": "Course Space owners cannot leave the space.",

  "leave-failed":
    "CampusFlow could not leave the Course Space. Please try again.",

  "not-space-owner": "Only the Course Space owner can delete this space.",

  "delete-space-failed":
    "CampusFlow could not delete the Course Space. Please try again.",
};

export default async function CourseSpacesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const errorCode = Array.isArray(params.error)
    ? params.error[0]
    : params.error;

  const pageError = errorCode
    ? (errorMessages[errorCode] ?? "Something went wrong. Please try again.")
    : null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [coursesResult, membershipResult] = await Promise.all([
    supabase
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
      .order("name"),

    supabase
      .from("course_space_members")
      .select(
        `
        role,

        course_space:course_spaces (
          id,
          name,
          code,
          invite_code
        )
      `,
      )
      .eq("user_id", user.id),
  ]);

  if (coursesResult.error) {
    throw new Error(coursesResult.error.message);
  }

  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  const courses = (coursesResult.data ?? []) as Course[];

  const memberships = (membershipResult.data ?? []) as SpaceMembership[];

  const availableCourses = courses.filter((course) => !course.course_space_id);

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Academic Community
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Course Spaces
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Connect your personal course to a shared class space with your
              classmates.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Courses
          </Link>
        </div>

        {/* ERROR BANNER */}
        {pageError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{pageError}</p>
          </div>
        )}

        {/* EXPLANATION */}
        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="font-semibold text-slate-950">
            How Course Spaces work
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Your personal course remains part of your own semester. A Course
            Space connects that course to a shared class circle so classmates
            can later share course-visible academic progress.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Course code
              </p>

              <p className="mt-2 text-sm font-medium text-slate-800">
                Academic identifier
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Example: ML401. Use the code assigned by your institution.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Course Space
              </p>

              <p className="mt-2 text-sm font-medium text-slate-800">
                Shared class circle
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Students in the same real class connect to the same space.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Invite code
              </p>

              <p className="mt-2 text-sm font-medium text-slate-800">
                Generated access code
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Share it only with classmates who should join the space.
              </p>
            </div>
          </div>
        </section>

        {/* CREATE + JOIN */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* CREATE */}
          <section className="rounded-2xl border bg-white p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Start a shared class
              </p>

              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Create a Course Space
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select one of your personal courses. CampusFlow will create a
                shared space and generate an invite code for classmates.
              </p>
            </div>

            {availableCourses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed p-5">
                <p className="text-sm text-slate-500">
                  All of your courses are already connected to Course Spaces.
                </p>

                {courses.length === 0 && (
                  <Link
                    href="/courses"
                    className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Create a course first →
                  </Link>
                )}
              </div>
            ) : (
              <form action={createCourseSpace} className="mt-6">
                <label
                  htmlFor="create-course-id"
                  className="text-sm font-medium text-slate-700"
                >
                  Personal course
                </label>

                <select
                  id="create-course-id"
                  name="course_id"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                >
                  <option value="" disabled>
                    Select course
                  </option>

                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code
                        ? `${course.code} · ${course.name}`
                        : `${course.name} · No course code`}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  The new Course Space inherits this course&apos;s name and
                  course code.
                </p>

                <button
                  type="submit"
                  className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Create Course Space
                </button>
              </form>
            )}
          </section>

          {/* JOIN */}
          <section className="rounded-2xl border bg-white p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Join classmates
              </p>

              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Join a Course Space
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the invite code from a classmate and connect the shared
                space to your matching personal course.
              </p>
            </div>

            {availableCourses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed p-5">
                <p className="text-sm leading-6 text-slate-500">
                  You need an unlinked personal course before joining another
                  Course Space.
                </p>
              </div>
            ) : (
              <form action={joinCourseSpace} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="invite-code"
                    className="text-sm font-medium text-slate-700"
                  >
                    Invite code
                  </label>

                  <input
                    id="invite-code"
                    name="invite_code"
                    required
                    maxLength={20}
                    autoComplete="off"
                    placeholder="Example: 7B91A2CD"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm uppercase tracking-wider text-slate-950 outline-none transition focus:border-slate-500"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Invite codes are generated by CampusFlow, not your academic
                    course code.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="join-course-id"
                    className="text-sm font-medium text-slate-700"
                  >
                    Connect to your course
                  </label>

                  <select
                    id="join-course-id"
                    name="course_id"
                    required
                    defaultValue=""
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                  >
                    <option value="" disabled>
                      Select your course
                    </option>

                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code
                          ? `${course.code} · ${course.name}`
                          : `${course.name} · No course code`}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    If both courses have a course code, the codes must match.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  Join Course Space
                </button>
              </form>
            )}
          </section>
        </div>

        {/* EXISTING SPACES */}
        <section className="mt-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Your Course Spaces
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Shared classes you currently belong to.
            </p>
          </div>

          {memberships.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
              <h3 className="font-medium text-slate-950">
                No Course Spaces yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create a space or join one using an invite code from a
                classmate.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {memberships.map((membership) => {
                const space = relationOne(membership.course_space);

                if (!space) {
                  return null;
                }

                return (
                  <Link
                    key={space.id}
                    href={`/course-spaces/${space.id}`}
                    className="group rounded-2xl border bg-white p-6 transition hover:border-slate-400 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          {space.code ?? "No course code"}
                        </p>

                        <h3 className="mt-2 text-lg font-semibold text-slate-950">
                          {space.name}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          membership.role === "owner"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {membership.role}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-xs text-slate-400">
                        Invite{" "}
                        <span className="font-mono tracking-wider">
                          {space.invite_code}
                        </span>
                      </p>

                      <p className="text-sm font-medium text-blue-600">
                        Open space →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
