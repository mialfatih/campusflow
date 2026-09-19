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

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getChecklistState(supabase: SupabaseClient, taskId: string) {
  const { data: items, error } = await supabase
    .from("task_checklist_items")
    .select("id, is_done")
    .eq("task_id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  const total = items?.length ?? 0;

  const completed = items?.filter((item) => item.is_done).length ?? 0;

  const hasChecklist = total > 0;

  const progress = hasChecklist ? Math.round((completed / total) * 100) : null;

  return {
    total,
    completed,
    hasChecklist,
    progress,
    allComplete: hasChecklist && completed === total,
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

  const checklist = await getChecklistState(supabase, taskId);

  let finalProgress = progress;

  if (checklist.hasChecklist && checklist.progress !== null) {
    finalProgress = checklist.progress;
  }

  if (status === "submitted") {
    if (checklist.hasChecklist && !checklist.allComplete) {
      throw new Error(
        `Complete all checklist items before submitting (${checklist.completed}/${checklist.total} completed).`,
      );
    }

    finalProgress = 100;
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
      progress: finalProgress,
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

const taskStatuses = ["todo", "in_progress", "review", "submitted"] as const;

type TaskStatus = (typeof taskStatuses)[number];

export async function moveTaskStatus(taskId: string, newStatus: string) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!taskStatuses.includes(newStatus as TaskStatus)) {
    throw new Error("Invalid task status.");
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskError || !task) {
    throw new Error("Assignment not found.");
  }

  const checklist = await getChecklistState(supabase, taskId);

  const updateData: {
    status: TaskStatus;
    submitted_at: string | null;
    progress?: number;
    need_help?: boolean;
  } = {
    status: newStatus as TaskStatus,
    submitted_at: newStatus === "submitted" ? new Date().toISOString() : null,
  };

  if (newStatus === "submitted") {
    if (checklist.hasChecklist && !checklist.allComplete) {
      throw new Error(
        `Complete all checklist items before submitting (${checklist.completed}/${checklist.total} completed).`,
      );
    }

    updateData.progress = 100;
    updateData.need_help = false;
  } else if (checklist.hasChecklist && checklist.progress !== null) {
    /*
     * When a submitted assignment is moved
     * back to another stage, restore progress
     * from the actual checklist state.
     */
    updateData.progress = checklist.progress;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
}
