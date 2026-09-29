"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
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

  /* =========================================================
     VALIDATION
  ========================================================= */

  if (!fullName) {
    return {
      status: "error",
      message: "Full name is required.",
    };
  }

  if (!username) {
    return {
      status: "error",
      message: "Username is required.",
    };
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      status: "error",
      message:
        "Username must be 3–30 characters and may contain lowercase letters, numbers, dots, underscores, or hyphens.",
    };
  }

  /* =========================================================
     CURRENT PROFILE
  ========================================================= */

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (currentProfileError) {
    return {
      status: "error",
      message:
        "CampusFlow could not load your current profile. Please try again.",
    };
  }

  const previousUsername = currentProfile?.username ?? null;

  /* =========================================================
     UPDATE
  ========================================================= */

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
      return {
        status: "error",
        message: "That username is already taken. Try another one.",
      };
    }

    console.error("Profile update failed:", error);

    return {
      status: "error",
      message: "CampusFlow could not save your profile. Please try again.",
    };
  }

  /* =========================================================
     REVALIDATE
  ========================================================= */

  revalidatePath("/dashboard");
  revalidatePath("/profile/settings");
  revalidatePath("/people");
  revalidatePath("/friends");
  revalidatePath("/feed");

  if (previousUsername) {
    revalidatePath(`/profile/${previousUsername}`);
  }

  revalidatePath(`/profile/${username}`);

  return {
    status: "success",
    message: "Profile saved successfully.",
  };
}
