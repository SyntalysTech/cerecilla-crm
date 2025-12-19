"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface TemplateFormData {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export async function createTemplate(data: TemplateFormData) {
  const user = await getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("email_templates")
    .insert({
      name: data.name,
      subject: data.subject,
      html: data.html,
      text: data.text || "",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una plantilla con ese nombre" };
    }
    return { error: error.message };
  }

  revalidatePath("/email-templates");
  redirect("/email-templates");
}

export async function updateTemplate(id: string, data: TemplateFormData) {
  const user = await getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("email_templates")
    .update({
      name: data.name,
      subject: data.subject,
      html: data.html,
      text: data.text || "",
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una plantilla con ese nombre" };
    }
    return { error: error.message };
  }

  revalidatePath("/email-templates");
  redirect("/email-templates");
}

export async function deleteTemplate(id: string) {
  const user = await getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/email-templates");
  return { success: true };
}

export async function getTemplate(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function duplicateTemplate(id: string) {
  const user = await getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Get original template
  const { data: original, error: fetchError } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) {
    return { error: "Plantilla no encontrada" };
  }

  // Create duplicate with new name
  const { data: template, error } = await supabase
    .from("email_templates")
    .insert({
      name: `${original.name} (copia)`,
      subject: original.subject,
      html: original.html,
      text: original.text || "",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Try with timestamp if name already exists
      const { error: error2 } = await supabase
        .from("email_templates")
        .insert({
          name: `${original.name} (copia ${Date.now()})`,
          subject: original.subject,
          html: original.html,
          text: original.text || "",
          created_by: user.id,
        });

      if (error2) {
        return { error: error2.message };
      }
    } else {
      return { error: error.message };
    }
  }

  revalidatePath("/email-templates");
  return { success: true, template };
}
