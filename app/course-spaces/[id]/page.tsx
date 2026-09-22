export const instant = false;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

import { leaveCourseSpace } from "../actions";

import { DeleteCourseSpaceForm } from "./delete-space-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MemberProfile = {
  id: string;
  username: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
};

type Member = {
  id: string;
  role: string;
  joined_at: string;

  profile: MemberProfile | MemberProfile[] | null;
};

type CourseSpaceProgress = {
  task_id: string;
  task_title: string;
  task_description: string | null;

  task_status: string;
  task_priority: string;
  task_progress: number;
  task_need_help: boolean;

  task_due_at: string | null;
  task_submitted_at: string | null;

  owner_id: string;
  owner_username: string;
  owner_full_name: string | null;

  course_id: string;
  course_name: string;
  course_code: string | null;
};

type StudentProgressGroup = {
  owner_id: string;
  owner_username: string;
  owner_full_name: string | null;
  tasks: CourseSpaceProgress[];
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
};

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function groupProgressByStudent(progress: CourseSpaceProgress[]) {
  const groups = new Map<string, StudentProgressGroup>();

  for (const task of progress) {
    const existing = groups.get(task.owner_id);

    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    groups.set(task.owner_id, {
      owner_id: task.owner_id,
      owner_username: task.owner_username,
      owner_full_name: task.owner_full_name,
      tasks: [task],
    });
  }

  return Array.from(groups.values());
}

export default async function CourseSpacePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /* =========================================================
     MEMBERSHIP CHECK
  ========================================================= */

  const { data: membership, error: membershipError } = await supabase
    .from("course_space_members")
    .select("role")
    .eq("course_space_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!membership) {
    notFound();
  }

  /* =========================================================
     COURSE SPACE DATA
  ========================================================= */

  const [spaceResult, membersResult, courseResult, progressResult] =
    await Promise.all([
      supabase
        .from("course_spaces")
        .select(
          `
        id,
        name,
        code,
        invite_code,
        created_at
      `,
        )
        .eq("id", id)
        .single(),

      supabase
        .from("course_space_members")
        .select(
          `
        id,
        role,
        joined_at,

        profile:profiles (
          id,
          username,
          full_name,
          university,
          major
        )
      `,
        )
        .eq("course_space_id", id)
        .order("joined_at"),

      supabase
        .from("courses")
        .select(
          `
        id,
        name,
        code
      `,
        )
        .eq("user_id", user.id)
        .eq("course_space_id", id)
        .maybeSingle(),

      supabase.rpc("get_course_space_progress", {
        p_space_id: id,
      }),
    ]);

  /* =========================================================
     ERRORS
  ========================================================= */

  if (spaceResult.error || !spaceResult.data) {
    notFound();
  }

  if (membersResult.error) {
    throw new Error(membersResult.error.message);
  }

  if (courseResult.error) {
    throw new Error(courseResult.error.message);
  }

  if (progressResult.error) {
    throw new Error(progressResult.error.message);
  }

  /* =========================================================
     PREPARE DATA
  ========================================================= */

  const space = spaceResult.data;

  const members = (membersResult.data ?? []) as Member[];

  const linkedCourse = courseResult.data;

  const progress = (progressResult.data ?? []) as CourseSpaceProgress[];

  const progressGroups = groupProgressByStudent(progress);

  const isOwner = membership.role === "owner";

  const activeTaskCount = progress.filter(
    (task) =>
      task.task_status === "in_progress" || task.task_status === "review",
  ).length;

  const needHelpCount = progress.filter((task) => task.task_need_help).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* =================================================
            COURSE SPACE HEADER
        ================================================== */}

        <section className="rounded-2xl border bg-white p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Course Space</p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {space.name}
              </h1>

              {space.code && (
                <p className="mt-2 text-slate-500">{space.code}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                    isOwner
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {membership.role}
                </span>

                <span className="text-xs text-slate-400">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>
              </div>

              {linkedCourse && (
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Your connected course
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {linkedCourse.code
                      ? `${linkedCourse.code} · ${linkedCourse.name}`
                      : linkedCourse.name}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Invite code
              </p>

              <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-slate-950">
                {space.invite_code}
              </p>

              <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-400">
                Share this code only with students who belong to this class.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            COURSE SPACE SUMMARY
        ================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">Members</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {members.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">Active shared work</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {activeTaskCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">Need Help</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {needHelpCount}
            </p>
          </div>
        </section>

        {/* =================================================
            MEMBERS
        ================================================== */}

        <section className="mt-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Members</h2>

            <p className="mt-1 text-sm text-slate-500">
              {members.length} {members.length === 1 ? "student" : "students"}{" "}
              in this Course Space.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {members.map((member) => {
              const profile = relationOne(member.profile);

              if (!profile) {
                return null;
              }

              const isCurrentUser = profile.id === user.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${profile.username}`}
                      className="font-medium text-slate-950 transition hover:text-blue-600"
                    >
                      {profile.full_name || profile.username}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      @{profile.username}
                      {isCurrentUser && " · You"}
                    </p>

                    {(profile.major || profile.university) && (
                      <p className="mt-2 truncate text-xs text-slate-400">
                        {[profile.major, profile.university]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      member.role === "owner"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* =================================================
            SHARED PROGRESS
        ================================================== */}

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Shared Progress
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Course-visible assignments shared by members of this Course
                Space.
              </p>
            </div>

            <p className="text-sm text-slate-400">
              {progress.length}{" "}
              {progress.length === 1 ? "assignment" : "assignments"}
            </p>
          </div>

          {progressGroups.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
              <h3 className="font-medium text-slate-950">
                No shared progress yet
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Assignments with visibility set to Course will appear here for
                members of this Course Space.
              </p>

              <Link
                href="/tasks"
                className="mt-5 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View your assignments
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {progressGroups.map((group) => {
                const isCurrentUser = group.owner_id === user.id;

                return (
                  <section
                    key={group.owner_id}
                    className="overflow-hidden rounded-2xl border bg-white"
                  >
                    {/* STUDENT HEADER */}

                    <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          href={`/profile/${group.owner_username}`}
                          className="font-semibold text-slate-950 transition hover:text-blue-600"
                        >
                          {group.owner_full_name || group.owner_username}
                        </Link>

                        <p className="mt-1 text-xs text-slate-500">
                          @{group.owner_username}
                          {isCurrentUser && " · You"}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400">
                        {group.tasks.length}{" "}
                        {group.tasks.length === 1
                          ? "shared assignment"
                          : "shared assignments"}
                      </p>
                    </div>

                    {/* TASKS */}

                    <div>
                      {group.tasks.map((task, index) => (
                        <SharedProgressCard
                          key={task.task_id}
                          task={task}
                          isOwner={task.owner_id === user.id}
                          showBorder={index !== group.tasks.length - 1}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            MEMBER MANAGEMENT
        ================================================== */}

        {!isOwner && (
          <section className="mt-10 border-t pt-6">
            <h2 className="text-sm font-semibold text-slate-950">
              Course Space membership
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
              Leaving disconnects your personal course from this Course Space.
              Your course, assignments, and progress remain in your account.
            </p>

            <form action={leaveCourseSpace} className="mt-4">
              <input type="hidden" name="space_id" value={space.id} />

              <button
                type="submit"
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Leave Course Space
              </button>
            </form>
          </section>
        )}

        {/* =================================================
            OWNER INFO
        ================================================== */}

        {isOwner && (
          <section className="mt-10 rounded-2xl border border-red-100 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-red-500">
              Course Space management
            </p>

            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Delete Course Space
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Deleting this Course Space disconnects every member from the
              shared class. Personal courses, assignments, checklists, and
              progress will remain in each student&apos;s account.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">
                What will happen
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Members will be removed from this space. Course-visible
                assignments will stop being shared until their owners connect
                the course to another Course Space.
              </p>
            </div>

            <div className="mt-5">
              <DeleteCourseSpaceForm
                spaceId={space.id}
                spaceName={space.name}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   SHARED PROGRESS CARD
========================================================= */

function SharedProgressCard({
  task,
  isOwner,
  showBorder,
}: {
  task: CourseSpaceProgress;
  isOwner: boolean;
  showBorder: boolean;
}) {
  return (
    <article className={`p-6 ${showBorder ? "border-b" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {task.course_code
                ? `${task.course_code} · ${task.course_name}`
                : task.course_name}
            </p>

            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-700">
              Course
            </span>
          </div>

          {isOwner ? (
            <Link
              href={`/tasks/${task.task_id}`}
              className="mt-2 block text-base font-semibold text-slate-950 transition hover:text-blue-600"
            >
              {task.task_title}
            </Link>
          ) : (
            <h3 className="mt-2 text-base font-semibold text-slate-950">
              {task.task_title}
            </h3>
          )}

          {task.task_description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
              {task.task_description}
            </p>
          )}
        </div>

        {task.task_need_help && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Need Help
          </span>
        )}
      </div>

      {/* STATUS + PROGRESS */}

      <div className="mt-5">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-medium text-slate-500">
            {statusLabels[task.task_status] ?? task.task_status}
          </span>

          <span className="font-semibold text-slate-700">
            {task.task_progress}%
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-950"
            style={{
              width: `${Math.min(Math.max(task.task_progress, 0), 100)}%`,
            }}
          />
        </div>
      </div>

      {/* META */}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
          {task.task_priority} priority
        </span>

        {task.task_due_at && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            Due {formatDate(task.task_due_at)}
          </span>
        )}

        {task.task_status === "submitted" && task.task_submitted_at && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
            Submitted {formatDate(task.task_submitted_at)}
          </span>
        )}
      </div>
    </article>
  );
}
