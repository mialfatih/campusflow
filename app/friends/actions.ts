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

function refreshSocialPages() {
  revalidatePath("/friends");
  revalidatePath("/people");
}

export async function sendFriendRequest(formData: FormData) {
  const { supabase } = await getClient();

  const receiverId = String(formData.get("receiver_id") ?? "");

  if (!receiverId) {
    throw new Error("User is required.");
  }

  const { error } = await supabase.rpc("send_friend_request", {
    p_receiver_id: receiverId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshSocialPages();
}

export async function acceptFriendRequest(formData: FormData) {
  const { supabase } = await getClient();

  const requestId = String(formData.get("request_id") ?? "");

  const { error } = await supabase.rpc("accept_friend_request", {
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshSocialPages();
}

export async function declineFriendRequest(formData: FormData) {
  const { supabase } = await getClient();

  const requestId = String(formData.get("request_id") ?? "");

  const { error } = await supabase.rpc("decline_friend_request", {
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshSocialPages();
}

export async function cancelFriendRequest(formData: FormData) {
  const { supabase } = await getClient();

  const requestId = String(formData.get("request_id") ?? "");

  const { error } = await supabase.rpc("cancel_friend_request", {
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshSocialPages();
}

export async function removeFriend(formData: FormData) {
  const { supabase } = await getClient();

  const friendshipId = String(formData.get("friendship_id") ?? "");

  const { error } = await supabase.rpc("remove_friend", {
    p_friendship_id: friendshipId,
  });

  if (error) {
    throw new Error(error.message);
  }

  refreshSocialPages();
}
