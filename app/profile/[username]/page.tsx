export const instant = false;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AppHeader } from "@/components/app-header";

import { sendFriendRequest } from "../../friends/actions";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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

  const isOwnProfile = profile.id === user.id;

  const { data: friendship } = !isOwnProfile
    ? await supabase
        .from("friendships")
        .select("id")
        .or(
          `and(user_one_id.eq.${user.id},user_two_id.eq.${profile.id}),and(user_one_id.eq.${profile.id},user_two_id.eq.${user.id})`,
        )
        .maybeSingle()
    : { data: null };

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
            `and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`,
          )
          .maybeSingle()
      : { data: null };

  return (
    <main className="min-h-screen bg-slate-50">
        <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border bg-white p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">
                {profile.full_name || profile.username}
              </h1>

              <p className="mt-2 text-slate-500">@{profile.username}</p>

              {(profile.major || profile.university) && (
                <p className="mt-4 text-sm text-slate-600">
                  {[profile.major, profile.university]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              {profile.bio && (
                <p className="mt-5 max-w-xl leading-7 text-slate-600">
                  {profile.bio}
                </p>
              )}
            </div>

            {isOwnProfile ? (
              <Link
                href="/profile/settings"
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Edit profile
              </Link>
            ) : friendship ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                Friends
              </span>
            ) : request ? (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                {request.sender_id === user.id
                  ? "Request sent"
                  : "Request received"}
              </span>
            ) : (
              <form action={sendFriendRequest}>
                <input type="hidden" name="receiver_id" value={profile.id} />

                <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                  Add friend
                </button>
              </form>
            )}
          </div>

          <div className="mt-10 border-t pt-8">
            <h2 className="font-semibold text-slate-950">Academic progress</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Friend-visible academic progress will appear here in the next
              social build stage.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
