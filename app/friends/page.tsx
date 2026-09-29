export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
} from "./actions";

import { RemoveFriendForm } from "./remove-friend-form";

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

  /* =========================================================
     FRIENDSHIPS
  ========================================================= */

  const { data: friendshipsData, error: friendshipsError } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
    .order("created_at", {
      ascending: false,
    });

  if (friendshipsError) {
    throw new Error(friendshipsError.message);
  }

  const friendships = friendshipsData ?? [];

  /* =========================================================
     PENDING REQUESTS
  ========================================================= */

  const { data: requestsData, error: requestsError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "pending")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", {
      ascending: false,
    });

  if (requestsError) {
    throw new Error(requestsError.message);
  }

  const requests = requestsData ?? [];

  /* =========================================================
     RELATED PROFILES
  ========================================================= */

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
    const { data, error: profilesError } = await supabase
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

    if (profilesError) {
      throw new Error(profilesError.message);
    }

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

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Social</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Friends
            </h1>

            <p className="mt-2 text-slate-600">
              Connect with classmates and follow academic progress together.
            </p>
          </div>

          <Link
            href="/people"
            className="inline-flex shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Find classmates
          </Link>
        </div>

        {/* SUMMARY */}

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Friends" value={friendships.length} />

          <SummaryCard
            label="Incoming"
            value={incoming.length}
            highlight={incoming.length > 0}
          />

          <SummaryCard label="Sent" value={outgoing.length} />
        </section>

        {/* INCOMING */}

        {incoming.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-950">
              Friend requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              People who want to connect with you.
            </p>

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

                    <div className="flex flex-wrap gap-2">
                      <form action={acceptFriendRequest}>
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <SubmitButton
                          pendingText="Accepting..."
                          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Accept
                        </SubmitButton>
                      </form>

                      <form action={declineFriendRequest}>
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <SubmitButton
                          pendingText="Declining..."
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Decline
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* OUTGOING */}

        {outgoing.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-950">
              Sent requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Requests waiting for a response.
            </p>

            <div className="mt-4 space-y-4">
              {outgoing.map((request) => {
                const profile = profileMap.get(request.receiver_id);

                if (!profile) {
                  return null;
                }

                return (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <ProfileInfo profile={profile} />

                    <form action={cancelFriendRequest}>
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.id}
                      />

                      <SubmitButton
                        pendingText="Cancelling..."
                        className="text-sm font-medium text-red-600 transition hover:text-red-800"
                      >
                        Cancel request
                      </SubmitButton>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FRIENDS */}

        <section className="mt-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Your friends
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Accepted connections on CampusFlow.
            </p>
          </div>

          {friendships.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
              <h3 className="font-medium text-slate-950">No friends yet</h3>

              <p className="mt-2 text-sm text-slate-500">
                Find classmates and send your first friend request.
              </p>

              <Link
                href="/people"
                className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
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

                const friendName = profile.full_name || profile.username;

                return (
                  <article
                    key={friendship.id}
                    className="rounded-2xl border bg-white p-5"
                  >
                    <ProfileInfo profile={profile} />

                    <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                      <Link
                        href={`/profile/${profile.username}`}
                        className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                      >
                        View profile →
                      </Link>

                      <RemoveFriendForm
                        friendshipId={friendship.id}
                        friendName={friendName}
                      />
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
    <div className="min-w-0">
      <Link
        href={`/profile/${profile.username}`}
        className="font-semibold text-slate-950 transition hover:text-blue-600"
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
        highlight ? "border-blue-200 bg-blue-50" : "bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          highlight ? "text-blue-700" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}
