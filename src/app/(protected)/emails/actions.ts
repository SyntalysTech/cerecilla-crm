"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/actions";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export interface SendEmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
}

export async function sendEmailAction(data: SendEmailData) {
  const user = await getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Parse recipients
  const toRecipients = data.to.split(",").map(email => ({ email: email.trim() }));
  const ccRecipients = data.cc ? data.cc.split(",").map(email => ({ email: email.trim() })) : undefined;
  const bccRecipients = data.bcc ? data.bcc.split(",").map(email => ({ email: email.trim() })) : undefined;

  // Create email record in database first (status: sending)
  const { data: emailRecord, error: dbError } = await supabase
    .from("emails")
    .insert({
      to_addresses: toRecipients.map(r => r.email),
      cc_addresses: ccRecipients?.map(r => r.email) || [],
      bcc_addresses: bccRecipients?.map(r => r.email) || [],
      subject: data.subject,
      html: data.html,
      text: data.text || "",
      status: "sending",
      template_id: data.templateId || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (dbError) {
    console.error("[Email] DB error:", dbError);
    return { error: "Error al guardar el email: " + dbError.message };
  }

  // Send the email
  const result = await sendEmail({
    to: toRecipients,
    cc: ccRecipients,
    bcc: bccRecipients,
    from: {
      email: process.env.SMTP_FROM || "info@cerecilla.com",
      name: process.env.SMTP_FROM_NAME || "Cerecilla",
    },
    subject: data.subject,
    html: data.html,
    text: data.text,
  });

  // Update email record with result
  if (result.success) {
    await supabase
      .from("emails")
      .update({
        status: "sent",
        provider_message_id: result.messageId,
        sent_at: new Date().toISOString(),
      })
      .eq("id", emailRecord.id);

    revalidatePath("/emails");
    return { success: true, messageId: result.messageId };
  } else {
    await supabase
      .from("emails")
      .update({
        status: "failed",
        error_message: result.error,
      })
      .eq("id", emailRecord.id);

    revalidatePath("/emails");
    return { error: result.error || "Error al enviar el email" };
  }
}

export async function getEmails() {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();

  const { data: emails } = await supabase
    .from("emails")
    .select("*")
    .order("created_at", { ascending: false });

  return emails || [];
}

export async function getEmailById(id: string) {
  const supabase = await createClient();

  const { data: email } = await supabase
    .from("emails")
    .select("*")
    .eq("id", id)
    .single();

  return email;
}
