"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
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

export async function createSemester(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim() || null;
  const endDate = String(formData.get("end_date") ?? "").trim() || null;

  if (!name) {
    throw new Error("Semester name is required.");
  }

  // Deactivate the current semester first.
  const { error: deactivateError } = await supabase
    .from("semesters")
    .update({
      is_active: false,
    })
    .eq("user_id", user.id);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error } = await supabase.from("semesters").insert({
    user_id: user.id,
    name,
    start_date: startDate,
    end_date: endDate,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

export async function setActiveSemester(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const semesterId = String(formData.get("semester_id") ?? "");

  if (!semesterId) {
    throw new Error("Semester ID is required.");
  }

  const { data: semester, error: semesterError } = await supabase
    .from("semesters")
    .select("id")
    .eq("id", semesterId)
    .eq("user_id", user.id)
    .single();

  if (semesterError || !semester) {
    throw new Error("Semester not found.");
  }

  const { error: deactivateError } = await supabase
    .from("semesters")
    .update({
      is_active: false,
    })
    .eq("user_id", user.id);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error } = await supabase
    .from("semesters")
    .update({
      is_active: true,
    })
    .eq("id", semesterId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

export async function createCourse(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const semesterId = String(formData.get("semester_id") ?? "");

  const name = String(formData.get("name") ?? "").trim();

  const code = String(formData.get("code") ?? "").trim() || null;

  if (!semesterId || !name) {
    throw new Error("Semester and course name are required.");
  }

  // Make sure the semester really belongs to this user.
  const { data: semester, error: semesterError } = await supabase
    .from("semesters")
    .select("id")
    .eq("id", semesterId)
    .eq("user_id", user.id)
    .single();

  if (semesterError || !semester) {
    throw new Error("Semester not found.");
  }

  const { error } = await supabase.from("courses").insert({
    user_id: user.id,
    semester_id: semesterId,
    name,
    code,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/courses");
}

export async function updateCourse(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const courseId = String(formData.get("course_id") ?? "");

  const name = String(formData.get("name") ?? "").trim();

  const code = String(formData.get("code") ?? "").trim() || null;

  if (!courseId || !name) {
    throw new Error("Course ID and course name are required.");
  }

  const { error } = await supabase
    .from("courses")
    .update({
      name,
      code,
    })
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/courses");
}

export async function deleteCourse(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const courseId = String(formData.get("course_id") ?? "");

  if (!courseId) {
    throw new Error("Course ID is required.");
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/courses");
}
