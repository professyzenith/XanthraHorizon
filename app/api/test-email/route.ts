import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  // Return config info (without exposing full key)
  const config = {
    apiKeySet: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + "..." : "NOT SET",
    apiKeyLength: apiKey?.length ?? 0,
    fromEmail: fromEmail ?? "NOT SET",
  };

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set", config }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: `Xanthra Horizon <${fromEmail ?? "onboarding@resend.dev"}>`,
      to: "professy69@gmail.com",
      subject: "Xanthra Horizon — Test Email ⚡",
      html: "<p>This is a test email from Xanthra Horizon. If you see this, Resend is working correctly!</p>",
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        config,
        resendError: {
          name: result.error.name,
          message: result.error.message,
          full: result.error,
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      config,
      emailId: result.data?.id,
      message: "Test email sent! Check professy69@gmail.com inbox.",
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      config,
      thrownError: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
