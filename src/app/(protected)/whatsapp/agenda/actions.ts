"use server";

import { createClient } from "@/lib/supabase/server";

export interface ScheduledCall {
  id: string;
  phone_number: string;
  sender_name: string | null;
  service_interest: string;
  requested_datetime: string | null;
  notes: string | null;
  status: "pending" | "completed" | "cancelled";
  message_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getScheduledCalls(): Promise<ScheduledCall[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("whatsapp_scheduled_calls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scheduled calls:", error);
    return [];
  }

  return data || [];
}

export async function updateCallStatus(
  callId: string,
  status: "pending" | "completed" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("whatsapp_scheduled_calls")
    .update({ status })
    .eq("id", callId);

  if (error) {
    console.error("Error updating call status:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteScheduledCall(
  callId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("whatsapp_scheduled_calls")
    .delete()
    .eq("id", callId);

  if (error) {
    console.error("Error deleting scheduled call:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
