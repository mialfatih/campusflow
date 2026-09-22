export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

import { acceptHelpOffer, declineHelpOffer } from "../help/actions";

import { markAllNotificationsRead, markNotificationRead } from "./actions";

type ProfileInfo = {
  username: string;
  full_name: string | null;
};

type TaskInfo = {
  title: string;
};

type HelpOfferInfo = {
  id: string;
  status: string;
};

type Notification = {
  id: string;
  type: string;
  read_at: string | null;
  created_at: string;
  help_offer_id: string | null;

  actor: ProfileInfo | ProfileInfo[] | null;

  task: TaskInfo | TaskInfo[] | null;

  help_offer: HelpOfferInfo | HelpOfferInfo[] | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      type,
      read_at,
      created_at,
      help_offer_id,

      actor:profiles!notifications_actor_id_fkey (
        username,
        full_name
      ),

      task:tasks!notifications_task_id_fkey (
        title
      ),

      help_offer:help_offers!notifications_help_offer_id_fkey (
        id,
        status
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const notifications = (data ?? []) as Notification[];

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* PAGE HEADER */}
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-blue-600">Updates</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Notifications
            </h1>

            <p className="mt-2 text-slate-600">
              Help offers and social updates that need your attention.
            </p>
          </div>

          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {/* EMPTY STATE */}
        {notifications.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center">
            <p className="text-sm text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {notifications.map((notification) => {
              const actor = relationOne(notification.actor);

              const task = relationOne(notification.task);

              const helpOffer = relationOne(notification.help_offer);

              const actorName =
                actor?.full_name || actor?.username || "CampusFlow user";

              const hasHelpRoom = Boolean(
                notification.help_offer_id &&
                helpOffer &&
                (helpOffer.status === "accepted" ||
                  helpOffer.status === "completed"),
              );

              return (
                <article
                  key={notification.id}
                  className={`rounded-2xl border p-5 ${
                    notification.read_at
                      ? "bg-white"
                      : "border-blue-200 bg-blue-50/50"
                  }`}
                >
                  {/* MESSAGE */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <NotificationMessage
                        type={notification.type}
                        actorName={actorName}
                        taskTitle={task?.title ?? "assignment"}
                      />

                      <p className="mt-2 text-xs text-slate-400">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.read_at && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </div>

                  {/* PENDING HELP OFFER */}
                  {notification.type === "help_offered" &&
                    notification.help_offer_id &&
                    helpOffer?.status === "pending" && (
                      <div className="mt-5 flex gap-2">
                        <form action={acceptHelpOffer}>
                          <input
                            type="hidden"
                            name="offer_id"
                            value={notification.help_offer_id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            Accept
                          </button>
                        </form>

                        <form action={declineHelpOffer}>
                          <input
                            type="hidden"
                            name="offer_id"
                            value={notification.help_offer_id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Decline
                          </button>
                        </form>
                      </div>
                    )}

                  {/* ACCEPTED STATUS */}
                  {notification.type === "help_offered" &&
                    helpOffer?.status === "accepted" && (
                      <div className="mt-4">
                        <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                          Help offer accepted
                        </span>
                      </div>
                    )}

                  {/* COMPLETED STATUS */}
                  {notification.type === "help_offered" &&
                    helpOffer?.status === "completed" && (
                      <div className="mt-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                          Help session completed
                        </span>
                      </div>
                    )}

                  {/* DECLINED STATUS */}
                  {notification.type === "help_offered" &&
                    helpOffer?.status === "declined" && (
                      <div className="mt-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                          Help offer declined
                        </span>
                      </div>
                    )}

                  {/* CANCELLED STATUS */}
                  {notification.type === "help_offered" &&
                    helpOffer?.status === "cancelled" && (
                      <div className="mt-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                          Help offer cancelled
                        </span>
                      </div>
                    )}

                  {/* HELP ROOM */}
                  {hasHelpRoom && notification.help_offer_id && (
                    <div className="mt-4">
                      <Link
                        href={`/help/${notification.help_offer_id}`}
                        className="inline-flex text-sm font-medium text-blue-600 transition hover:text-blue-800"
                      >
                        {helpOffer?.status === "completed"
                          ? "View Help Room →"
                          : "Open Help Room →"}
                      </Link>
                    </div>
                  )}

                  {/* MARK READ */}
                  {!notification.read_at &&
                    notification.type !== "help_offered" && (
                      <form action={markNotificationRead} className="mt-4">
                        <input
                          type="hidden"
                          name="notification_id"
                          value={notification.id}
                        />

                        <button
                          type="submit"
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      </form>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function NotificationMessage({
  type,
  actorName,
  taskTitle,
}: {
  type: string;
  actorName: string;
  taskTitle: string;
}) {
  if (type === "help_offered") {
    return (
      <p className="text-sm leading-6 text-slate-700">
        <strong className="text-slate-950">{actorName}</strong> offered to help
        you with <strong className="text-slate-950">{taskTitle}</strong>.
      </p>
    );
  }

  if (type === "help_offer_accepted") {
    return (
      <p className="text-sm leading-6 text-slate-700">
        <strong className="text-slate-950">{actorName}</strong> accepted your
        offer to help with{" "}
        <strong className="text-slate-950">{taskTitle}</strong>.
      </p>
    );
  }

  if (type === "help_offer_declined") {
    return (
      <p className="text-sm leading-6 text-slate-700">
        <strong className="text-slate-950">{actorName}</strong> declined your
        offer to help with{" "}
        <strong className="text-slate-950">{taskTitle}</strong>.
      </p>
    );
  }

  if (type === "help_message") {
    return (
      <p className="text-sm leading-6 text-slate-700">
        <strong className="text-slate-950">{actorName}</strong> sent a message
        about <strong className="text-slate-950">{taskTitle}</strong>.
      </p>
    );
  }

  if (type === "help_session_resolved") {
    return (
      <p className="text-sm leading-6 text-slate-700">
        <strong className="text-slate-950">{actorName}</strong> marked the help
        session for <strong className="text-slate-950">{taskTitle}</strong> as
        resolved.
      </p>
    );
  }

  return <p className="text-sm text-slate-700">You have a new notification.</p>;
}
