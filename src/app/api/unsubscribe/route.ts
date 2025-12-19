import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return new Response(
      generateHtmlResponse(
        "Error",
        "No se proporcionó un email válido.",
        false
      ),
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  try {
    // Get campaign_id if provided
    const campaignId = searchParams.get("c") || searchParams.get("campaign");

    // Save unsubscribe request to database
    const { error: insertError } = await supabase
      .from("email_unsubscribes")
      .insert({
        email: email,
        campaign_id: campaignId || null,
        reason: "email_link",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        user_agent: request.headers.get("user-agent") || null,
      });

    // If table doesn't exist, create it first
    if (insertError?.code === "42P01") {
      // Table doesn't exist - log the unsubscribe anyway
      console.log(`[Unsubscribe] Email: ${email} - Table doesn't exist yet`);
    } else if (insertError?.code === "23505") {
      // Already unsubscribed (duplicate key)
      console.log(`[Unsubscribe] Email: ${email} - Already unsubscribed`);
    } else if (insertError) {
      console.error("[Unsubscribe] Error:", insertError);
    }

    // Also mark in clientes table if exists
    await supabase
      .from("clientes")
      .update({ unsubscribed: true })
      .eq("email", email);

    // Update campaign recipient if campaign_id provided
    if (campaignId) {
      await supabase
        .from("email_campaign_recipients")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("campaign_id", campaignId)
        .eq("email", email);
    }

    // Return success page
    return new Response(
      generateHtmlResponse(
        "Baja confirmada",
        `El email ${email} ha sido dado de baja correctamente. Ya no recibirás más comunicaciones comerciales de Cerecilla.`,
        true
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return new Response(
      generateHtmlResponse(
        "Error",
        "Ha ocurrido un error procesando tu solicitud. Por favor, contacta con lopd@cerecilla.com",
        false
      ),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return Response.json({ error: "Email requerido" }, { status: 400 });
    }

    // Save unsubscribe request
    const { error } = await supabase
      .from("email_unsubscribes")
      .insert({
        email: email,
        reason: "api",
      });

    if (error && error.code !== "23505") {
      console.error("[Unsubscribe API] Error:", error);
    }

    // Also mark in clientes table if exists
    await supabase
      .from("clientes")
      .update({ unsubscribed: true })
      .eq("email", email);

    return Response.json({ success: true, message: "Baja procesada correctamente" });
  } catch (error) {
    console.error("[Unsubscribe API] Error:", error);
    return Response.json({ error: "Error procesando la solicitud" }, { status: 500 });
  }
}

function generateHtmlResponse(title: string, message: string, success: boolean): string {
  const iconColor = success ? "#22c55e" : "#ef4444";
  const iconSvg = success
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Cerecilla</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon { margin-bottom: 24px; }
    h1 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .logo {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .logo span {
      color: #BB292A;
      font-size: 20px;
      font-weight: bold;
    }
    a {
      color: #BB292A;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${iconSvg}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="https://cerecilla.com">Volver a Cerecilla</a></p>
    <div class="logo">
      <span>Cerecilla</span>
    </div>
  </div>
</body>
</html>`;
}
