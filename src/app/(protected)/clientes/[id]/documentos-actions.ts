"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ClienteDocumento {
  id: string;
  cliente_id: string;
  nombre: string;
  descripcion: string | null;
  archivo_url: string;
  archivo_nombre: string;
  archivo_size: number | null;
  archivo_type: string | null;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  created_at: string;
}

export async function getClienteDocumentos(clienteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cliente_documentos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cliente documentos:", error);
    return [];
  }

  return data as ClienteDocumento[];
}

export async function uploadClienteDocumento(
  clienteId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const file = formData.get("file") as File;
  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;

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
  const fileName = `${clienteId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("cliente-documentos")
    .upload(fileName, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { error: "Error al subir el archivo: " + uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("cliente-documentos")
    .getPublicUrl(fileName);

  // Get user email from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  // Save document metadata
  const { data, error } = await supabase
    .from("cliente_documentos")
    .insert({
      cliente_id: clienteId,
      nombre,
      descripcion: descripcion || null,
      archivo_url: urlData.publicUrl,
      archivo_nombre: file.name,
      archivo_size: file.size,
      archivo_type: file.type,
      uploaded_by: user.id,
      uploaded_by_email: profile?.email || user.email,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving documento:", error);
    // Try to clean up uploaded file
    await supabase.storage.from("cliente-documentos").remove([fileName]);
    return { error: error.message };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath(`/clientes/${clienteId}/edit`);
  return { success: true, documento: data };
}

export async function deleteClienteDocumento(
  documentoId: string,
  clienteId: string
) {
  const supabase = await createClient();

  // First get the documento to find the file path
  const { data: documento } = await supabase
    .from("cliente_documentos")
    .select("archivo_url")
    .eq("id", documentoId)
    .single();

  // Delete from database
  const { error } = await supabase
    .from("cliente_documentos")
    .delete()
    .eq("id", documentoId);

  if (error) {
    console.error("Error deleting documento:", error);
    return { error: error.message };
  }

  // Try to delete from storage (extract path from URL)
  if (documento?.archivo_url) {
    try {
      const urlParts = documento.archivo_url.split("/cliente-documentos/");
      if (urlParts[1]) {
        await supabase.storage.from("cliente-documentos").remove([urlParts[1]]);
      }
    } catch (e) {
      console.error("Error deleting file from storage:", e);
    }
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath(`/clientes/${clienteId}/edit`);
  return { success: true };
}
