export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";

import { createClient } from "@/lib/supabase/server";

type FeedActivity = {
  activity_id: string;
  activity_type: string;
  activity_metadata: Record<string, unknown>;
  activity_created_at: string;

  actor_id: string;
  actor_username: string;
  actor_full_name: string | null;
  actor_avatar_url: string | null;

  task_id: string;
  task_title: string;
  task_visibility: string;

  course_name: string | null;
  course_code: string | null;

  is_own_activity: boolean;
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
};

function activityText(activity: FeedActivity) {
  switch (activity.activity_type) {
    case "task_created":
      return "created";

    case "task_submitted":
      return "submitted";

    case "need_help_requested":
      return "needs help with";

    case "need_help_resolved":
      return "no longer needs help with";

    case "status_changed":
      return "moved";

    default:
      return "updated";
  }
}

function formatDate(date: string) {
  const value = new Date(date);

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase.rpc("get_social_feed", {
    p_limit: 50,
  });

  if (error) {
    throw new Error(error.message);
  }

  const activities = (data ?? []) as FeedActivity[];

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <p className="text-sm font-medium text-blue-600">Social Progress</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Feed
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            See meaningful academic progress from you and your friends. No
            manual posts required.
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <h2 className="font-semibold text-slate-950">Your feed is quiet</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add friends or update an assignment to start seeing academic
              progress here.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/people"
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white"
              >
                Find classmates
              </Link>

              <Link
                href="/tasks"
                className="rounded-lg border px-5 py-2.5 text-sm font-medium text-slate-700"
              >
                View assignments
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {activities.map((activity) => (
              <FeedCard key={activity.activity_id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function FeedCard({ activity }: { activity: FeedActivity }) {
  const actorName = activity.actor_full_name || activity.actor_username;

  const fromStatus = String(activity.activity_metadata?.from_status ?? "");

  const toStatus = String(activity.activity_metadata?.to_status ?? "");

  return (
    <article className="rounded-2xl border bg-white p-6">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
          {actorName
            .split(" ")
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/profile/${activity.actor_username}`}
                className="font-semibold text-slate-950 hover:text-blue-600"
              >
                {actorName}
              </Link>

              {activity.is_own_activity && (
                <span className="ml-2 text-xs text-slate-400">You</span>
              )}
            </div>

            <time className="text-xs text-slate-400">
              {formatDate(activity.activity_created_at)}
            </time>
          </div>

          <div className="mt-4">
            <p className="text-sm leading-6 text-slate-600">
              {activityText(activity)}{" "}
              <span className="font-semibold text-slate-950">
                {activity.task_title}
              </span>
            </p>

            {activity.activity_type === "status_changed" && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                  {statusLabels[fromStatus] ?? fromStatus}
                </span>

                <span className="text-slate-400">→</span>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                  {statusLabels[toStatus] ?? toStatus}
                </span>
              </div>
            )}

            {activity.activity_type === "need_help_requested" && (
              <div className="mt-3 inline-flex rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Looking for help
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {activity.course_code
                ? `${activity.course_code} · ${activity.course_name}`
                : activity.course_name || "Academic Task"}
            </p>

            {activity.is_own_activity && (
              <Link
                href={`/tasks/${activity.task_id}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Open assignment
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
