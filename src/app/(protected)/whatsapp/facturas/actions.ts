"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markFileReviewed(fileId: string) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("whatsapp_received_files")
    .update({
      reviewed: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.user?.id || null,
    })
    .eq("id", fileId);

  if (error) {
    console.error("Error marking file as reviewed:", error);
    return { error: error.message };
  }

  revalidatePath("/whatsapp/facturas");
  return { success: true };
}

export async function addFileNote(fileId: string, note: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("whatsapp_received_files")
    .update({ notes: note })
    .eq("id", fileId);

  if (error) {
    console.error("Error adding note:", error);
    return { error: error.message };
  }

  revalidatePath("/whatsapp/facturas");
  return { success: true };
}

export async function getFileData(fileId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("whatsapp_received_files")
    .select("file_data_base64, mime_type, media_type")
    .eq("id", fileId)
    .single();

  if (error || !data) {
    console.error("Error getting file data:", error);
    return { error: error?.message || "File not found" };
  }

  return {
    success: true,
    fileData: data.file_data_base64,
    mimeType: data.mime_type,
    mediaType: data.media_type,
  };
}
