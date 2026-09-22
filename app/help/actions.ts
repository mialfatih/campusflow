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

function refreshHelpPages() {
  revalidatePath("/feed");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function offerHelp(formData: FormData) {
  const { supabase } = await getClient();

  const taskId = String(formData.get("task_id") ?? "");

  if (!taskId) {
    throw new Error("Assignment is required.");
  }

  const { error } = await supabase.rpc("offer_help", {
    p_task_id: taskId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshHelpPages();
}

export async function acceptHelpOffer(formData: FormData) {
  const { supabase } = await getClient();

  const offerId = String(formData.get("offer_id") ?? "");

  const { error } = await supabase.rpc("accept_help_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshHelpPages();
}

export async function declineHelpOffer(formData: FormData) {
  const { supabase } = await getClient();

  const offerId = String(formData.get("offer_id") ?? "");

  const { error } = await supabase.rpc("decline_help_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshHelpPages();
}

export async function cancelHelpOffer(formData: FormData) {
  const { supabase } = await getClient();

  const offerId = String(formData.get("offer_id") ?? "");

  const { error } = await supabase.rpc("cancel_help_offer", {
    p_offer_id: offerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshHelpPages();
}
