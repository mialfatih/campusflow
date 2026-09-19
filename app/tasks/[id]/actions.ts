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

async function getOwnedTask(taskId: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: task, error } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (error || !task) {
    throw new Error("Assignment not found.");
  }

  return {
    supabase,
    user,
    task,
  };
}

async function syncTaskProgress(taskId: string) {
  const { supabase, user, task } = await getOwnedTask(taskId);

  // A submitted task should remain at 100%.
  if (task.status === "submitted") {
    return;
  }

  const { data: items, error } = await supabase
    .from("task_checklist_items")
    .select("is_done")
    .eq("task_id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  if (!items || items.length === 0) {
    return;
  }

  const completedItems = items.filter((item) => item.is_done).length;

  const progress = Math.round((completedItems / items.length) * 100);

  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      progress,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

function refreshTask(taskId: string) {
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function createChecklistItem(formData: FormData) {
  const taskId = String(formData.get("task_id") ?? "");

  const content = String(formData.get("content") ?? "").trim();

  if (!taskId || !content) {
    throw new Error("Task and checklist content are required.");
  }

  const { supabase } = await getOwnedTask(taskId);

  const { data: lastItem } = await supabase
    .from("task_checklist_items")
    .select("position")
    .eq("task_id", taskId)
    .order("position", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  const nextPosition = (lastItem?.position ?? -1) + 1;

  const { error } = await supabase.from("task_checklist_items").insert({
    task_id: taskId,
    content,
    position: nextPosition,
    is_done: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncTaskProgress(taskId);

  refreshTask(taskId);
}

export async function toggleChecklistItem(formData: FormData) {
  const taskId = String(formData.get("task_id") ?? "");

  const itemId = String(formData.get("item_id") ?? "");

  const currentValue = String(formData.get("is_done")) === "true";

  if (!taskId || !itemId) {
    throw new Error("Checklist item is required.");
  }

  const { supabase } = await getOwnedTask(taskId);

  const { error } = await supabase
    .from("task_checklist_items")
    .update({
      is_done: !currentValue,
    })
    .eq("id", itemId)
    .eq("task_id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  await syncTaskProgress(taskId);

  refreshTask(taskId);
}

export async function deleteChecklistItem(formData: FormData) {
  const taskId = String(formData.get("task_id") ?? "");

  const itemId = String(formData.get("item_id") ?? "");

  if (!taskId || !itemId) {
    throw new Error("Checklist item is required.");
  }

  const { supabase } = await getOwnedTask(taskId);

  const { error } = await supabase
    .from("task_checklist_items")
    .delete()
    .eq("id", itemId)
    .eq("task_id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  await syncTaskProgress(taskId);

  refreshTask(taskId);
}
