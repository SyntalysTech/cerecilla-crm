import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSESProvider } from "@/lib/email/ses";

interface SendEmailRequest {
  templateId?: string;
  to: string;
  subject?: string;
  html?: string;
  text?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: SendEmailRequest = await request.json();

    if (!body.to) {
      return NextResponse.json(
        { error: "Missing required field: to" },
        { status: 400 }
      );
    }

    // Get template if provided
    let subject = body.subject;
    let html = body.html;
    let text = body.text;
    let templateId: string | null = null;

    if (body.templateId) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", body.templateId)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      subject = template.subject;
      html = template.html;
      text = template.text;
      templateId = template.id;
    }

    if (!subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: subject and html (or provide a templateId)" },
        { status: 400 }
      );
    }

    // Check SES configuration
    const sesProvider = getSESProvider();

    if (!sesProvider.isConfigured()) {
      // Create a queued email record even if SES is not configured
      const { data: emailRecord, error: insertError } = await supabase
        .from("emails")
        .insert({
          to_email: body.to,
          subject,
          template_id: templateId,
          status: "queued",
          provider: "ses",
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating email record:", insertError);
        return NextResponse.json(
          { error: "Failed to create email record" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message: "SES not configured yet. Email queued for later sending.",
          emailId: emailRecord.id,
          status: "queued",
        },
        { status: 202 }
      );
    }

    // TODO: When SES is configured, send the email
    // const result = await sesProvider.sendEmail({
    //   to: [{ email: body.to }],
    //   from: { email: process.env.SES_FROM_ADDRESS! },
    //   subject,
    //   html,
    //   text,
    // });
    //
    // if (result.success) {
    //   // Insert sent email record
    //   await supabase.from("emails").insert({
    //     to_email: body.to,
    //     subject,
    //     template_id: templateId,
    //     status: "sent",
    //     provider: "ses",
    //     provider_message_id: result.messageId,
    //     created_by: user.id,
    //   });
    //
    //   return NextResponse.json({ success: true, messageId: result.messageId });
    // } else {
    //   // Insert failed email record
    //   await supabase.from("emails").insert({
    //     to_email: body.to,
    //     subject,
    //     template_id: templateId,
    //     status: "failed",
    //     provider: "ses",
    //     created_by: user.id,
    //   });
    //
    //   return NextResponse.json({ error: result.error }, { status: 500 });
    // }

    return NextResponse.json(
      {
        message: "SES not configured yet. Configure AWS credentials to enable email sending.",
        required_env_vars: [
          "AWS_REGION",
          "AWS_ACCESS_KEY_ID",
          "AWS_SECRET_ACCESS_KEY",
          "SES_FROM_ADDRESS",
        ],
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Error in email send route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
