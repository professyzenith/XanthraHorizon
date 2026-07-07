import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emailSender";

export async function GET(req: NextRequest) {
  const config = {
    apiKeySet: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8) + "...",
    apiKeyLength: process.env.RESEND_API_KEY?.length ?? 0,
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "NOT SET",
    cronSecretSet: !!process.env.CRON_SECRET,
    unsubscribeSecretSet: !!process.env.UNSUBSCRIBE_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "NOT SET",
  };

  // Test unsubscribe token signing
  let tokenTest: { ok: boolean; error?: string } = { ok: false };
  try {
    const { signUnsubscribeToken } = await import("@/lib/unsubscribeToken");
    signUnsubscribeToken("00000000-0000-0000-0000-000000000000");
    tokenTest = { ok: true };
  } catch (err) {
    tokenTest = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Test full sendWelcomeEmail pipeline to Resend account owner email
  let emailTest: { ok: boolean; error?: string } = { ok: false };
  try {
    const result = await sendWelcomeEmail(
      "professy69@gmail.com",
      "00000000-0000-0000-0000-000000000000",
      "10:00",
      "Asia/Kolkata"
    );
    if (result.success) {
      emailTest = { ok: true };
    } else {
      emailTest = { ok: false, error: result.error };
    }
  } catch (err) {
    emailTest = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({ config, tokenTest, emailTest });
}
