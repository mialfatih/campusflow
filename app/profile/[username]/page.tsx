export const instant = false;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

import { sendFriendRequest } from "../../friends/actions";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

type ProfileTask = {
  task_id: string;
  task_title: string;
  task_description: string | null;

  task_status: string;
  task_priority: string;
  task_progress: number;
  task_need_help: boolean;
  task_visibility: string;

  task_due_at: string | null;
  task_submitted_at: string | null;

  course_id: string;
  course_name: string;
  course_code: string | null;
};

type ProfileActivity = {
  activity_id: string;
  activity_type: string;

  activity_metadata: Record<string, unknown> | null;

  activity_created_at: string;

  task_id: string;
  task_title: string;
  task_visibility: string;

  course_name: string | null;
  course_code: string | null;
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function activityLabel(activity: ProfileActivity) {
  if (activity.activity_type === "task_created") {
    return "Created";
  }

  if (activity.activity_type === "task_submitted") {
    return "Submitted";
  }

  if (activity.activity_type === "need_help_requested") {
    return "Needs help with";
  }

  if (activity.activity_type === "need_help_resolved") {
    return "No longer needs help with";
  }

  if (activity.activity_type === "status_changed") {
    return "Moved";
  }

  return "Updated";
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const currentUserId = user.id;

  // -------------------------------------------------------
  // PROFILE
  // -------------------------------------------------------

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id,
      username,
      full_name,
      university,
      major,
      bio
    `,
    )
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = profile.id === currentUserId;

  // -------------------------------------------------------
  // FRIENDSHIP
  // -------------------------------------------------------

  const { data: friendship } = !isOwnProfile
    ? await supabase
        .from("friendships")
        .select("id")
        .or(
          `and(user_one_id.eq.${currentUserId},user_two_id.eq.${profile.id}),and(user_one_id.eq.${profile.id},user_two_id.eq.${currentUserId})`,
        )
        .maybeSingle()
    : { data: null };

  const isFriend = Boolean(friendship);

  // -------------------------------------------------------
  // PENDING REQUEST
  // -------------------------------------------------------

  const { data: request } =
    !isOwnProfile && !friendship
      ? await supabase
          .from("friend_requests")
          .select(
            `
            id,
            sender_id,
            receiver_id
          `,
          )
          .eq("status", "pending")
          .or(
            `and(sender_id.eq.${currentUserId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUserId})`,
          )
          .maybeSingle()
      : { data: null };

  // -------------------------------------------------------
  // ACADEMIC PROGRESS
  // Database RPC enforces privacy.
  // -------------------------------------------------------

  const [tasksResult, activitiesResult] = await Promise.all([
    supabase.rpc("get_profile_visible_tasks", {
      p_profile_id: profile.id,
    }),

    supabase.rpc("get_profile_visible_activities", {
      p_profile_id: profile.id,
      p_limit: 8,
    }),
  ]);

  if (tasksResult.error) {
    throw new Error(tasksResult.error.message);
  }

  if (activitiesResult.error) {
    throw new Error(activitiesResult.error.message);
  }

  const tasks = (tasksResult.data ?? []) as ProfileTask[];

  const activities = (activitiesResult.data ?? []) as ProfileActivity[];

  // -------------------------------------------------------
  // PROFILE STATISTICS
  // -------------------------------------------------------

  const inProgressCount = tasks.filter(
    (task) => task.task_status === "in_progress",
  ).length;

  const reviewCount = tasks.filter(
    (task) => task.task_status === "review",
  ).length;

  const submittedCount = tasks.filter(
    (task) => task.task_status === "submitted",
  ).length;

  const needHelpCount = tasks.filter((task) => task.task_need_help).length;

  // "Currently working on":
  // active academic work only.
  const currentTasks = tasks
    .filter(
      (task) =>
        task.task_status === "in_progress" || task.task_status === "review",
    )
    .slice(0, 6);

  const canSeeProgress = isOwnProfile || isFriend;

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ================================================
            PROFILE HEADER
        ================================================= */}

        <section className="rounded-2xl border bg-white p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-white">
                  {(profile.full_name || profile.username || "U")
                    .split(" ")
                    .slice(0, 2)
                    .map((word: string) => word.charAt(0).toUpperCase())
                    .join("")}
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {profile.full_name || profile.username}
                  </h1>

                  <p className="mt-1 text-slate-500">@{profile.username}</p>
                </div>
              </div>

              {(profile.major || profile.university) && (
                <p className="mt-6 text-sm text-slate-600">
                  {[profile.major, profile.university]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              {profile.bio && (
                <p className="mt-4 max-w-xl leading-7 text-slate-600">
                  {profile.bio}
                </p>
              )}
            </div>

            <div>
              {isOwnProfile ? (
                <Link
                  href="/profile/settings"
                  className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Edit profile
                </Link>
              ) : friendship ? (
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  Friends
                </span>
              ) : request ? (
                <Link
                  href="/friends"
                  className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
                >
                  {request.sender_id === currentUserId
                    ? "Request sent"
                    : "Respond to request"}
                </Link>
              ) : (
                <form action={sendFriendRequest}>
                  <input type="hidden" name="receiver_id" value={profile.id} />

                  <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                    Add friend
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ================================================
            NOT FRIEND
        ================================================= */}

        {!canSeeProgress && (
          <section className="mt-6 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Academic progress is private
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Connect as friends to see assignments that{" "}
              {profile.full_name || profile.username} chooses to share with
              friends.
            </p>
          </section>
        )}

        {canSeeProgress && (
          <>
            {/* ================================================
                SUMMARY
            ================================================= */}

            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-950">
                  Academic summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {isOwnProfile
                    ? "Your current academic workload."
                    : "Friend-visible academic progress."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard label="In Progress" value={inProgressCount} />

                <SummaryCard label="Review" value={reviewCount} />

                <SummaryCard label="Submitted" value={submittedCount} />

                <SummaryCard label="Need Help" value={needHelpCount} />
              </div>
            </section>

            {/* ================================================
                CURRENTLY WORKING ON
            ================================================= */}

            <section className="mt-10">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Currently working on
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Active assignments and work under review.
                </p>
              </div>

              {currentTasks.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No active assignments to show.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {currentTasks.map((task) => (
                    <TaskProgressCard
                      key={task.task_id}
                      task={task}
                      isOwner={isOwnProfile}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ================================================
                RECENT PROGRESS
            ================================================= */}

            <section className="mt-10">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Recent progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recent meaningful activity across academic work.
                </p>
              </div>

              {activities.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No recent progress to show.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border bg-white">
                  {activities.map((activity, index) => {
                    const fromStatus = String(
                      activity.activity_metadata?.from_status ?? "",
                    );

                    const toStatus = String(
                      activity.activity_metadata?.to_status ?? "",
                    );

                    return (
                      <div
                        key={activity.activity_id}
                        className={`p-5 ${
                          index !== activities.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm leading-6 text-slate-700">
                              {activityLabel(activity)}{" "}
                              <span className="font-semibold text-slate-950">
                                {activity.task_title}
                              </span>
                            </p>

                            {activity.activity_type === "status_changed" && (
                              <p className="mt-1 text-xs text-slate-500">
                                {statusLabels[fromStatus] ?? fromStatus}
                                {" → "}
                                {statusLabels[toStatus] ?? toStatus}
                              </p>
                            )}

                            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                              {activity.course_code
                                ? `${activity.course_code} · ${activity.course_name}`
                                : (activity.course_name ?? "Academic Task")}
                            </p>
                          </div>

                          <time className="shrink-0 text-xs text-slate-400">
                            {formatDate(activity.activity_created_at)}
                          </time>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function TaskProgressCard({
  task,
  isOwner,
}: {
  task: ProfileTask;
  isOwner: boolean;
}) {
  return (
    <article className="rounded-2xl border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {task.course_code
              ? `${task.course_code} · ${task.course_name}`
              : task.course_name}
          </p>

          {isOwner ? (
            <Link
              href={`/tasks/${task.task_id}`}
              className="mt-2 block font-semibold text-slate-950 transition hover:text-blue-600"
            >
              {task.task_title}
            </Link>
          ) : (
            <h3 className="mt-2 font-semibold text-slate-950">
              {task.task_title}
            </h3>
          )}
        </div>

        {task.task_need_help && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Need Help
          </span>
        )}
      </div>

      {task.task_description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
          {task.task_description}
        </p>
      )}

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
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
              width: `${task.task_progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
          {task.task_priority} priority
        </span>

        {task.task_due_at && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            Due {formatDate(task.task_due_at)}
          </span>
        )}
      </div>
    </article>
  );
}
