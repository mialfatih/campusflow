export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      username,
      full_name,
      university,
      major,
      bio
    `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Account</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Profile settings
            </h1>

            <p className="mt-2 text-slate-600">
              This information appears on your CampusFlow profile.
            </p>
          </div>

          <Link
            href={`/profile/${profile.username}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View profile →
          </Link>
        </div>

        {/* USERNAME INFORMATION */}

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-950">
            About your username
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            You can change your CampusFlow username at any time as long as the
            new username is available.
          </p>

          <p className="mt-2 text-xs leading-5 text-blue-700">
            Changing your username changes your profile URL, but does not change
            your account, friendships, courses, assignments, or permissions.
          </p>
        </div>

        <ProfileForm
          username={profile.username}
          fullName={profile.full_name ?? ""}
          university={profile.university ?? ""}
          major={profile.major ?? ""}
          bio={profile.bio ?? ""}
        />
      </div>
    </main>
  );
}
