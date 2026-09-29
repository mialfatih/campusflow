export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

import { sendFriendRequest } from "../friends/actions";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type Person = {
  id: string;
  username: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
};

export default async function PeoplePage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;

  const query = q.trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const currentUserId = user.id;

  /* =========================================================
     SEARCH
  ========================================================= */

  let people: Person[] = [];

  if (query.length >= 2) {
    const { data, error: peopleError } = await supabase
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
      .neq("id", currentUserId)
      .ilike("username", `%${query}%`)
      .limit(20);

    if (peopleError) {
      throw new Error(peopleError.message);
    }

    people = data ?? [];
  }

  /* =========================================================
     RELATIONSHIPS
  ========================================================= */

  const { data: friendshipData, error: friendshipError } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`);

  if (friendshipError) {
    throw new Error(friendshipError.message);
  }

  const friendships = friendshipData ?? [];

  const { data: requestData, error: requestError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "pending")
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

  if (requestError) {
    throw new Error(requestError.message);
  }

  const requests = requestData ?? [];

  function relationshipFor(personId: string) {
    const friendship = friendships.find(
      (friendship) =>
        friendship.user_one_id === personId ||
        friendship.user_two_id === personId,
    );

    if (friendship) {
      return "friends";
    }

    const request = requests.find(
      (request) =>
        request.sender_id === personId || request.receiver_id === personId,
    );

    if (!request) {
      return "none";
    }

    if (request.sender_id === currentUserId) {
      return "outgoing";
    }

    return "incoming";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {/* HEADER */}

        <div>
          <p className="text-sm font-medium text-blue-600">Discover</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Find classmates
          </h1>

          <p className="mt-2 text-slate-600">
            Search CampusFlow users by username.
          </p>
        </div>

        {/* SEARCH */}

        <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search username..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        {query.length > 0 && query.length < 2 && (
          <p className="mt-3 text-xs text-slate-400">
            Enter at least 2 characters to search.
          </p>
        )}

        {/* RESULTS */}

        <div className="mt-8 space-y-4">
          {query.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
              <h2 className="font-medium text-slate-950">Search CampusFlow</h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter a classmate&apos;s username to find their profile.
              </p>
            </div>
          )}

          {query.length >= 2 && people.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
              <h2 className="font-medium text-slate-950">No users found</h2>

              <p className="mt-2 text-sm text-slate-500">
                Try another username.
              </p>
            </div>
          )}

          {people.map((person) => {
            const relationship = relationshipFor(person.id);

            return (
              <article
                key={person.id}
                className="flex flex-col gap-5 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/profile/${person.username}`}
                    className="font-semibold text-slate-950 transition hover:text-blue-600"
                  >
                    {person.full_name || person.username}
                  </Link>

                  <p className="mt-1 text-sm text-slate-500">
                    @{person.username}
                  </p>

                  {(person.major || person.university) && (
                    <p className="mt-2 text-sm text-slate-500">
                      {[person.major, person.university]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {relationship === "none" && (
                    <form action={sendFriendRequest}>
                      <input
                        type="hidden"
                        name="receiver_id"
                        value={person.id}
                      />

                      <SubmitButton
                        pendingText="Sending..."
                        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Add friend
                      </SubmitButton>
                    </form>
                  )}

                  {relationship === "friends" && (
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                      Friends
                    </span>
                  )}

                  {relationship === "outgoing" && (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500">
                      Request sent
                    </span>
                  )}

                  {relationship === "incoming" && (
                    <Link
                      href="/friends"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Respond to request →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
