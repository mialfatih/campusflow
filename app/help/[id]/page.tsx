export const instant = false;

import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";

import { HelpMessageScroll } from "@/components/help-message-scroll";

import { createClient } from "@/lib/supabase/server";

import { resolveHelpSession, sendHelpMessage } from "./actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ChecklistItem = {
  id: string;
  content: string;
  is_done: boolean;
  position: number;
};

type HelpRoom = {
  offer_id: string;
  offer_status: string;
  offer_created_at: string;
  offer_completed_at: string | null;

  task_id: string;
  task_title: string;
  task_description: string | null;
  task_status: string;
  task_progress: number;
  task_need_help: boolean;
  task_priority: string;
  task_due_at: string | null;

  course_name: string | null;
  course_code: string | null;

  owner_id: string;
  owner_username: string | null;
  owner_full_name: string | null;

  helper_id: string;
  helper_username: string | null;
  helper_full_name: string | null;

  viewer_is_owner: boolean;

  checklist: ChecklistItem[];
};

type HelpMessage = {
  message_id: string;
  author_id: string;
  author_username: string | null;
  author_full_name: string | null;
  message_content: string;
  message_created_at: string;
};

function formatDate(date: string | null) {
  if (!date) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
};

export default async function HelpRoomPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase.rpc("get_help_room_context", {
    p_offer_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }

  const context = ((data ?? [])[0] ?? null) as HelpRoom | null;

  if (!context) {
    notFound();
  }

  const { error: markReadError } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("help_offer_id", id)
    .is("read_at", null);

  if (markReadError) {
    throw new Error(markReadError.message);
  }

  const { data: messageData, error: messageError } = await supabase.rpc(
    "get_help_room_messages",
    {
      p_offer_id: id,
    },
  );

  if (messageError) {
    throw new Error(messageError.message);
  }

  const messages = (messageData ?? []) as HelpMessage[];

  const checklist = context.checklist ?? [];

  const isCompleted = context.offer_status === "completed";

  const ownerName =
    context.owner_full_name || context.owner_username || "Task owner";

  const helperName =
    context.helper_full_name || context.helper_username || "Helper";

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* HEADER */}

        <section className="rounded-2xl border bg-white p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium text-blue-600">Help Room</p>

                {isCompleted ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Completed
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Active Help
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {context.task_title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {context.course_code
                  ? `${context.course_code} · ${context.course_name}`
                  : (context.course_name ?? "Academic Task")}
              </p>
            </div>

            <div className="text-sm text-slate-500">
              <p>
                <span className="font-medium text-slate-700">Owner:</span>{" "}
                {ownerName}
              </p>

              <p className="mt-1">
                <span className="font-medium text-slate-700">Helper:</span>{" "}
                {helperName}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* DISCUSSION */}

          <section className="rounded-2xl border bg-white p-7">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Discussion
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep the conversation focused on this assignment.
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-slate-500">No messages yet.</p>

                {!isCompleted && (
                  <p className="mt-1 text-xs text-slate-400">
                    Start the discussion about the issue that needs help.
                  </p>
                )}
              </div>
            ) : (
              <HelpMessageScroll messageCount={messages.length}>
                {messages.map((message) => {
                  const authorName =
                    message.author_full_name ||
                    message.author_username ||
                    "CampusFlow user";

                  const isMine = message.author_id === user.id;

                  return (
                    <div
                      key={message.message_id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? "bg-slate-950 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${
                            isMine ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {authorName}
                        </p>

                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                          {message.message_content}
                        </p>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatDateTime(message.message_created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </HelpMessageScroll>
            )}

            {!isCompleted && (
              <form action={sendHelpMessage} className="mt-8 border-t pt-6">
                <input type="hidden" name="offer_id" value={context.offer_id} />

                <textarea
                  name="content"
                  required
                  maxLength={2000}
                  rows={3}
                  placeholder="Write a message..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Send message
                  </button>
                </div>
              </form>
            )}

            {isCompleted && (
              <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                This help session has been completed. The discussion is now
                read-only.
              </div>
            )}
          </section>

          {/* TASK CONTEXT */}

          <aside className="space-y-5">
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold text-slate-950">
                Assignment context
              </h2>

              {context.task_description && (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {context.task_description}
                </p>
              )}

              <dl className="mt-5 space-y-4">
                <Detail
                  label="Status"
                  value={
                    statusLabels[context.task_status] ?? context.task_status
                  }
                />

                <Detail label="Progress" value={`${context.task_progress}%`} />

                <Detail
                  label="Priority"
                  value={
                    context.task_priority.charAt(0).toUpperCase() +
                    context.task_priority.slice(1)
                  }
                />

                <Detail
                  label="Deadline"
                  value={formatDate(context.task_due_at)}
                />
              </dl>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950"
                  style={{
                    width: `${context.task_progress}%`,
                  }}
                />
              </div>
            </section>

            {checklist.length > 0 && (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-semibold text-slate-950">Checklist</h2>

                <div className="mt-4 space-y-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] ${
                          item.is_done
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-300 text-transparent"
                        }`}
                      >
                        ✓
                      </span>

                      <span
                        className={
                          item.is_done
                            ? "text-slate-400 line-through"
                            : "text-slate-600"
                        }
                      >
                        {item.content}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isCompleted && context.viewer_is_owner && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="font-semibold text-emerald-950">
                  Problem solved?
                </h2>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Resolve the help session when you no longer need assistance
                  with this assignment.
                </p>

                <form action={resolveHelpSession} className="mt-5">
                  <input
                    type="hidden"
                    name="offer_id"
                    value={context.offer_id}
                  />

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                  >
                    Resolve Help
                  </button>
                </form>
              </section>
            )}

            {!isCompleted && !context.viewer_is_owner && (
              <section className="rounded-2xl border bg-white p-6">
                <p className="text-sm leading-6 text-slate-500">
                  The task owner will close this help session once the issue is
                  resolved.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
