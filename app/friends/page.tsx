export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";

import { createClient } from "@/lib/supabase/server";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "./actions";

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
};

export default async function FriendsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: friendshipsData } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
    .order("created_at", {
      ascending: false,
    });

  const friendships = friendshipsData ?? [];

  const { data: requestsData } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "pending")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", {
      ascending: false,
    });

  const requests = requestsData ?? [];

  const relatedIds = new Set<string>();

  friendships.forEach((friendship) => {
    relatedIds.add(
      friendship.user_one_id === user.id
        ? friendship.user_two_id
        : friendship.user_one_id,
    );
  });

  requests.forEach((request) => {
    relatedIds.add(
      request.sender_id === user.id ? request.receiver_id : request.sender_id,
    );
  });

  let profiles: Profile[] = [];

  if (relatedIds.size > 0) {
    const { data } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        full_name,
        university,
        major
      `,
      )
      .in("id", Array.from(relatedIds));

    profiles = data ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const incoming = requests.filter(
    (request) => request.receiver_id === user.id,
  );

  const outgoing = requests.filter((request) => request.sender_id === user.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-medium text-blue-600">Social</p>

        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Friends</h1>

        <p className="mt-2 text-slate-600">
          Connect with classmates and follow academic progress together.
        </p>

        {incoming.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-950">
              Friend requests
            </h2>

            <div className="mt-4 space-y-4">
              {incoming.map((request) => {
                const profile = profileMap.get(request.sender_id);

                if (!profile) {
                  return null;
                }

                return (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <ProfileInfo profile={profile} />

                    <div className="flex gap-2">
                      <form action={acceptFriendRequest}>
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                          Accept
                        </button>
                      </form>

                      <form action={declineFriendRequest}>
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <button className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600">
                          Decline
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {outgoing.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-950">
              Sent requests
            </h2>

            <div className="mt-4 space-y-4">
              {outgoing.map((request) => {
                const profile = profileMap.get(request.receiver_id);

                if (!profile) {
                  return null;
                }

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-2xl border bg-white p-5"
                  >
                    <ProfileInfo profile={profile} />

                    <form action={cancelFriendRequest}>
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.id}
                      />

                      <button className="text-sm font-medium text-red-600">
                        Cancel
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-950">Your friends</h2>

          {friendships.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
              <p className="text-sm text-slate-500">
                You have not added any friends yet.
              </p>

              <Link
                href="/people"
                className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white"
              >
                Find classmates
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {friendships.map((friendship) => {
                const friendId =
                  friendship.user_one_id === user.id
                    ? friendship.user_two_id
                    : friendship.user_one_id;

                const profile = profileMap.get(friendId);

                if (!profile) {
                  return null;
                }

                return (
                  <article
                    key={friendship.id}
                    className="rounded-2xl border bg-white p-5"
                  >
                    <ProfileInfo profile={profile} />

                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                      <Link
                        href={`/profile/${profile.username}`}
                        className="text-sm font-medium text-blue-600"
                      >
                        View profile
                      </Link>

                      <form action={removeFriend}>
                        <input
                          type="hidden"
                          name="friendship_id"
                          value={friendship.id}
                        />

                        <button className="text-xs font-medium text-red-500">
                          Remove
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileInfo({ profile }: { profile: Profile }) {
  return (
    <div>
      <Link
        href={`/profile/${profile.username}`}
        className="font-semibold text-slate-950 hover:text-blue-600"
      >
        {profile.full_name || profile.username}
      </Link>

      <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>

      {(profile.major || profile.university) && (
        <p className="mt-2 text-xs text-slate-400">
          {[profile.major, profile.university].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
