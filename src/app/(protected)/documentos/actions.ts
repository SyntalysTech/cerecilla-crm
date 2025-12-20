"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Documento {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  archivo_url: string;
  archivo_nombre: string;
  created_at: string;
}

export async function getDocumentos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documentos:", error);
    return [];
  }

  return data as Documento[];
}

export async function uploadDocumento(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("file") as File;
  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const tipo = formData.get("tipo") as string;

  if (!file || !nombre) {
    return { error: "Archivo y nombre son requeridos" };
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Upload file to storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { error: "Error al subir el archivo: " + uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(fileName);

  // Save document metadata
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      nombre,
      descripcion: descripcion || null,
      tipo: tipo || "otro",
      archivo_url: urlData.publicUrl,
      archivo_nombre: file.name,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving documento:", error);
    // Try to clean up uploaded file
    await supabase.storage.from("documentos").remove([fileName]);
    return { error: error.message };
  }

  revalidatePath("/documentos");
  return { success: true, documento: data };
}

export async function deleteDocumento(documentoId: string) {
  const supabase = await createClient();

  // First get the documento to find the file path
  const { data: documento } = await supabase
    .from("documentos")
    .select("archivo_url")
    .eq("id", documentoId)
    .single();

  // Delete from database
  const { error } = await supabase
    .from("documentos")
    .delete()
    .eq("id", documentoId);

  if (error) {
    console.error("Error deleting documento:", error);
    return { error: error.message };
  }

  // Try to delete from storage (extract path from URL)
  if (documento?.archivo_url) {
    try {
      const urlParts = documento.archivo_url.split("/documentos/");
      if (urlParts[1]) {
        await supabase.storage.from("documentos").remove([urlParts[1]]);
      }
    } catch (e) {
      console.error("Error deleting file from storage:", e);
    }
  }

  revalidatePath("/documentos");
  return { success: true };
}
