export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AppHeader } from "@/components/app-header";

import { sendFriendRequest } from "../friends/actions";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
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

  let people: Array<{
    id: string;
    username: string;
    full_name: string | null;
    university: string | null;
    major: string | null;
  }> = [];

  if (query.length >= 2) {
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
      .neq("id", currentUserId)
      .ilike("username", `%${query}%`)
      .limit(20);

    people = data ?? [];
  }

  const { data: friendshipData } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`);

  const friendships = friendshipData ?? [];

  const { data: requestData } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "pending")
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

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

      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-medium text-blue-600">Discover</p>

        <h1 className="mt-1 text-3xl font-semibold text-slate-950">
          Find classmates
        </h1>

        <p className="mt-2 text-slate-600">
          Search CampusFlow users by username.
        </p>

        <form className="mt-8 flex gap-3">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search username..."
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
          />

          <button className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            Search
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {query.length >= 2 && people.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              No users found.
            </div>
          )}

          {people.map((person) => {
            const relationship = relationshipFor(person.id);

            return (
              <article
                key={person.id}
                className="flex flex-col gap-5 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/profile/${person.username}`}
                    className="font-semibold text-slate-950 hover:text-blue-600"
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

                {relationship === "none" && (
                  <form action={sendFriendRequest}>
                    <input type="hidden" name="receiver_id" value={person.id} />

                    <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                      Add friend
                    </button>
                  </form>
                )}

                {relationship === "friends" && (
                  <span className="text-sm font-medium text-emerald-600">
                    Friends
                  </span>
                )}

                {relationship === "outgoing" && (
                  <span className="text-sm font-medium text-slate-500">
                    Request sent
                  </span>
                )}

                {relationship === "incoming" && (
                  <Link
                    href="/friends"
                    className="text-sm font-medium text-blue-600"
                  >
                    Respond to request
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
