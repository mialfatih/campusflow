"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  const fullName = String(formData.get("full_name") ?? "").trim();

  const university = String(formData.get("university") ?? "").trim() || null;

  const major = String(formData.get("major") ?? "").trim() || null;

  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    throw new Error(
      "Username must be 3-30 characters and may contain lowercase letters, numbers, dots, underscores, or hyphens.",
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      university,
      major,
      bio,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That username is already taken.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${username}`);
}
