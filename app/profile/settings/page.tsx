export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { updateProfile } from "./actions";

export default async function ProfileSettingsPage() {
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
      username,
      full_name,
      university,
      major,
      bio
    `,
    )
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight text-slate-950"
          >
            CampusFlow
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm font-medium text-blue-600">Account</p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Profile settings
        </h1>

        <p className="mt-2 text-slate-600">
          This information appears on your CampusFlow profile.
        </p>

        <form
          action={updateProfile}
          className="mt-8 space-y-5 rounded-2xl border bg-white p-7"
        >
          <Field
            label="Username"
            name="username"
            defaultValue={profile?.username ?? ""}
            required
          />

          <Field
            label="Full name"
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            required
          />

          <Field
            label="University"
            name="university"
            defaultValue={profile?.university ?? ""}
          />

          <Field
            label="Major"
            name="major"
            defaultValue={profile?.major ?? ""}
          />

          <div>
            <label className="text-sm font-medium text-slate-700">Bio</label>

            <textarea
              name="bio"
              defaultValue={profile?.bio ?? ""}
              rows={4}
              placeholder="A short introduction..."
              className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save profile
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>

      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
      />
    </div>
  );
}
