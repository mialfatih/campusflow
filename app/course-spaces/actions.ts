"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return {
    supabase,
    user,
  };
}

function revalidateCourseSpacePages() {
  revalidatePath("/course-spaces");
  revalidatePath("/courses");
  revalidatePath("/tasks");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
}

/* =========================================================
   CREATE COURSE SPACE
========================================================= */

export async function createCourseSpace(formData: FormData) {
  const { supabase } = await getClient();

  const courseId = String(formData.get("course_id") ?? "");

  if (!courseId) {
    redirect("/course-spaces?error=select-course");
  }

  const { data, error } = await supabase.rpc("create_course_space", {
    p_course_id: courseId,
  });

  if (error) {
    console.error("Create Course Space error:", error);

    if (error.message.includes("already belongs to a Course Space")) {
      redirect("/course-spaces?error=course-linked");
    }

    redirect("/course-spaces?error=create-failed");
  }

  revalidateCourseSpacePages();

  redirect(`/course-spaces/${data}`);
}

/* =========================================================
   JOIN COURSE SPACE
========================================================= */

export async function joinCourseSpace(formData: FormData) {
  const { supabase } = await getClient();

  const inviteCode = String(formData.get("invite_code") ?? "")
    .trim()
    .toUpperCase();

  const courseId = String(formData.get("course_id") ?? "");

  if (!inviteCode) {
    redirect("/course-spaces?error=invite-required");
  }

  if (!courseId) {
    redirect("/course-spaces?error=select-course");
  }

  const { data, error } = await supabase.rpc("join_course_space", {
    p_invite_code: inviteCode,
    p_course_id: courseId,
  });

  if (error) {
    console.error("Join Course Space error:", error);

    if (error.message.includes("invite code is invalid")) {
      redirect("/course-spaces?error=invalid-invite");
    }

    if (error.message.includes("already a member")) {
      redirect("/course-spaces?error=already-member");
    }

    if (error.message.includes("already belongs to a Course Space")) {
      redirect("/course-spaces?error=course-linked");
    }

    if (error.message.includes("Course code does not match")) {
      redirect("/course-spaces?error=course-code-mismatch");
    }

    if (error.message.includes("Course not found")) {
      redirect("/course-spaces?error=course-not-found");
    }

    redirect("/course-spaces?error=join-failed");
  }

  revalidateCourseSpacePages();

  redirect(`/course-spaces/${data}`);
}

/* =========================================================
   LEAVE COURSE SPACE
========================================================= */

export async function leaveCourseSpace(formData: FormData) {
  const { supabase } = await getClient();

  const spaceId = String(formData.get("space_id") ?? "");

  if (!spaceId) {
    redirect("/course-spaces");
  }

  const { error } = await supabase.rpc("leave_course_space", {
    p_space_id: spaceId,
  });

  if (error) {
    console.error("Leave Course Space error:", error);

    if (error.message.includes("owners cannot leave")) {
      redirect("/course-spaces?error=owner-cannot-leave");
    }

    redirect("/course-spaces?error=leave-failed");
  }

  revalidateCourseSpacePages();

  redirect("/course-spaces");
}

/* =========================================================
   DELETE / DISSOLVE COURSE SPACE
========================================================= */

export async function deleteCourseSpace(formData: FormData) {
  const { supabase } = await getClient();

  const spaceId = String(formData.get("space_id") ?? "");

  if (!spaceId) {
    redirect("/course-spaces");
  }

  const { error } = await supabase.rpc("delete_course_space", {
    p_space_id: spaceId,
  });

  if (error) {
    console.error("Delete Course Space error:", error);

    if (error.message.includes("Only the Course Space owner")) {
      redirect("/course-spaces?error=not-space-owner");
    }

    redirect("/course-spaces?error=delete-space-failed");
  }

  revalidateCourseSpacePages();

  redirect("/course-spaces");
}
