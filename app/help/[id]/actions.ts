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

export async function sendHelpMessage(formData: FormData) {
  const { supabase } = await getClient();

  const offerId = String(formData.get("offer_id") ?? "");

  const content = String(formData.get("content") ?? "").trim();

  if (!offerId || !content) {
    throw new Error("Message cannot be empty.");
  }

  const { error } = await supabase.rpc("send_help_message", {
    p_offer_id: offerId,
    p_content: content,
  });

  if (error) {
    /*
     * Another participant may have resolved the
     * Help Room while this browser was still
     * displaying the old active state.
     *
     * The database correctly rejects the message.
     * Instead of showing a runtime error, refresh
     * the room so the user sees the completed state.
     */
    if (error.message.includes("Active help session not found")) {
      revalidatePath(`/help/${offerId}`);
      revalidatePath("/notifications");
      revalidatePath("/feed");

      redirect(`/help/${offerId}`);
    }

    throw new Error(error.message);
  }

  revalidatePath(`/help/${offerId}`);
  revalidatePath("/notifications");
}

export async function resolveHelpSession(formData: FormData) {
  const { supabase } = await getClient();

  const offerId = String(formData.get("offer_id") ?? "");

  if (!offerId) {
    throw new Error("Help session is required.");
  }

  const { error } = await supabase.rpc("resolve_help_session", {
    p_offer_id: offerId,
  });

  if (error) {
    /*
     * Handles stale tabs / double submissions.
     * If the room has already been resolved,
     * simply reload its current state.
     */
    if (error.message.includes("Active help session not found")) {
      revalidatePath(`/help/${offerId}`);
      redirect(`/help/${offerId}`);
    }

    throw new Error(error.message);
  }

  revalidatePath(`/help/${offerId}`);
  revalidatePath("/feed");
  revalidatePath("/notifications");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  redirect(`/help/${offerId}`);
}
