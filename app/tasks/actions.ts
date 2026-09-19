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

function normalizeDate(value: FormDataEntryValue | null) {
  const date = String(value ?? "").trim();

  if (!date) {
    return null;
  }

  // Store a date-only deadline consistently.
  return `${date}T23:59:59.000Z`;
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const courseId = String(formData.get("course_id") ?? "");

  const title = String(formData.get("title") ?? "").trim();

  const description = String(formData.get("description") ?? "").trim() || null;

  const dueAt = normalizeDate(formData.get("due_date"));

  const priority = String(formData.get("priority") ?? "medium");

  const visibility = String(formData.get("visibility") ?? "private");

  if (!courseId || !title) {
    throw new Error("Course and assignment title are required.");
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (courseError || !course) {
    throw new Error("Course not found.");
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    course_id: courseId,
    title,
    description,
    due_at: dueAt,
    priority,
    visibility,
    status: "todo",
    progress: 0,
    need_help: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTask(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const taskId = String(formData.get("task_id") ?? "");

  const courseId = String(formData.get("course_id") ?? "");

  const title = String(formData.get("title") ?? "").trim();

  const description = String(formData.get("description") ?? "").trim() || null;

  const dueAt = normalizeDate(formData.get("due_date"));

  const priority = String(formData.get("priority") ?? "medium");

  const status = String(formData.get("status") ?? "todo");

  const visibility = String(formData.get("visibility") ?? "private");

  const progressValue = Number(formData.get("progress") ?? 0);

  const progress = Math.max(0, Math.min(100, progressValue));

  const needHelp = formData.get("need_help") === "on";

  if (!taskId || !courseId || !title) {
    throw new Error("Task, course, and title are required.");
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (courseError || !course) {
    throw new Error("Course not found.");
  }

  const submittedAt = status === "submitted" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      course_id: courseId,
      title,
      description,
      due_at: dueAt,
      priority,
      status,
      progress: status === "submitted" ? 100 : progress,
      need_help: status === "submitted" ? false : needHelp,
      visibility,
      submitted_at: submittedAt,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const taskId = String(formData.get("task_id") ?? "");

  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
