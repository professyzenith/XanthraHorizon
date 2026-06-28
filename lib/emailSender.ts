import { Resend } from "resend";
import { BriefingData } from "@/types";
import { signUnsubscribeToken } from "@/lib/unsubscribeToken";

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape all special HTML characters to prevent XSS from RSS-sourced content
function htmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHTML(briefing: BriefingData, unsubscribeUrl: string): string {
  const storyCards = briefing.stories
    .map(
      (story, i) => `
    <div style="margin-bottom:24px;padding:24px;background:#0e0c0a;border:1px solid #1e1b17;border-radius:14px;">

      <!-- Story header -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:linear-gradient(135deg,#c9a853,#d4875a);border-radius:6px;color:#1a1208;font-size:11px;font-weight:700;font-family:monospace;flex-shrink:0;">${i + 1}</span>
        <span style="background:#1a1712;color:#c9a853;font-size:10px;font-weight:600;padding:3px 9px;border-radius:20px;letter-spacing:0.06em;font-family:monospace;border:1px solid #2a2318;">${htmlEscape(story.source)}</span>
      </div>

      <!-- Story title -->
      <h2 style="margin:0 0 12px;font-size:17px;font-weight:700;color:#f0ece3;line-height:1.45;letter-spacing:-0.01em;">
        <a href="${htmlEscape(story.url)}" style="color:#f0ece3;text-decoration:none;">${htmlEscape(story.title)}</a>
      </h2>

      <!-- Summary -->
      <p style="margin:0 0 16px;color:#8a8070;font-size:14px;line-height:1.75;">${htmlEscape(story.summary)}</p>

      <!-- Why it matters -->
      <div style="padding:14px 16px;background:#080604;border-left:3px solid #c9a853;border-radius:0 8px 8px 0;margin-bottom:16px;">
        <p style="margin:0 0 5px;color:#c9a853;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;">WHY IT MATTERS</p>
        <p style="margin:0;color:#9a8e7a;font-size:13px;line-height:1.7;">${htmlEscape(story.why_it_matters)}</p>
      </div>

      <!-- Read more link -->
      <a href="${htmlEscape(story.url)}" style="display:inline-flex;align-items:center;gap:5px;color:#c9a853;font-size:13px;text-decoration:none;font-weight:500;letter-spacing:0.01em;">
        Read full story
        <span style="font-size:12px;">→</span>
      </a>
    </div>
  `
    )
    .join("");

  const safeDate           = htmlEscape(briefing.date);
  const safeExecBrief      = htmlEscape(briefing.executive_brief);
  const safeStoryCount     = briefing.stories.length;
  const safeUnsubscribeUrl = htmlEscape(unsubscribeUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xanthra Horizon — ${safeDate}</title>
</head>
<body style="margin:0;padding:0;background:#060504;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:640px;margin:0 auto;padding:48px 20px 32px;">

    <!-- Top badge -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;padding:5px 16px;background:#0e0c0a;border:1px solid #2a2318;border-radius:24px;">
        <span style="color:#c9a853;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;font-family:monospace;">XANTHRA HORIZON</span>
      </div>
    </div>

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid #1a1712;">
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#f0ece3;letter-spacing:-0.03em;">${safeDate}</h1>
      <p style="margin:0 0 10px;color:#c9a853;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Know What Matters Next.</p>
      <p style="margin:0;color:#52473a;font-size:13px;">${safeStoryCount} developments that matter today · Powered by Gemini AI</p>
    </div>

    <!-- Executive Brief -->
    <div style="margin-bottom:40px;padding:24px;background:linear-gradient(135deg,#0d0b09,#110f0c);border:1px solid #2a2318;border-radius:14px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#c9a853,#0f9388,transparent);"></div>
      <p style="margin:0 0 10px;color:#c9a853;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;font-family:monospace;">TODAY'S OVERVIEW</p>
      <p style="margin:0;color:#c4b89a;font-size:15px;line-height:1.8;font-style:italic;">${safeExecBrief}</p>
    </div>

    <!-- Section label -->
    <p style="margin:0 0 20px;color:#52473a;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;font-family:monospace;">TOP STORIES</p>

    <!-- Stories -->
    <div style="margin-bottom:48px;">
      ${storyCards}
    </div>

    <!-- Divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,#1e1b17,transparent);margin-bottom:32px;"></div>

    <!-- Footer -->
    <div style="text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
        <div style="width:20px;height:20px;background:linear-gradient(135deg,#c9a853,#d4875a);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#1a1208;font-size:10px;font-weight:700;">⚡</span>
        </div>
        <span style="color:#52473a;font-size:12px;font-weight:600;">Xanthra Horizon</span>
      </div>
      <p style="margin:0 0 8px;color:#3a3020;font-size:12px;line-height:1.6;">
        You're receiving this because you subscribed to Xanthra Horizon.<br>
        Free forever · No ads · No spam.
      </p>
      <a href="${safeUnsubscribeUrl}" style="color:#52473a;font-size:12px;text-decoration:underline;text-decoration-color:#2a2318;">Unsubscribe</a>
    </div>

  </div>
</body>
</html>
`;
}

export async function sendBriefingEmail(
  email: string,
  briefing: BriefingData,
  subscriberId: string
): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = signUnsubscribeToken(subscriberId);
  const unsubscribeUrl = `${appUrl}/unsubscribe?id=${subscriberId}&token=${token}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@xanthrahorizon.com";

  // ⚠️  IMPORTANT: onboarding@resend.dev is a Resend sandbox address.
  // It can ONLY send to the email address registered on your Resend account.
  // Sending to any other recipient returns HTTP 403 ("You can only send testing
  // emails to your own email address").  To fix:
  //   1. Verify your own domain at resend.com/domains
  //   2. Set RESEND_FROM_EMAIL=hello@xanthrahorizon.com in .env.local
  if (fromEmail === "onboarding@resend.dev") {
    console.warn(
      "[emailSender] RESEND_FROM_EMAIL is set to onboarding@resend.dev. " +
      "This sandbox address can only deliver to the Resend account owner email. " +
      "All other recipients will receive HTTP 403. " +
      "Set RESEND_FROM_EMAIL to an address on a verified domain."
    );
  }

  try {
    const result = await resend.emails.send({
      from: `Xanthra Horizon <${fromEmail}>`,
      to: email,
      subject: `Xanthra Horizon: ${briefing.date} — ${briefing.stories[0]?.title?.slice(0, 60) ?? "Know What Matters Next"}`,
      html: buildEmailHTML(briefing, unsubscribeUrl),
    });

    if (result.error) {
      // Log full details — statusCode, name, and message — so future failures
      // are immediately diagnosable without needing to reproduce the request.
      console.error(
        `[emailSender] Resend rejected email to=${email} from=${fromEmail}.`,
        `Error name: ${result.error.name}.`,
        `Message: ${result.error.message}.`,
        `Full error object: ${JSON.stringify(result.error)}`
      );
      return { success: false, error: `${result.error.name}: ${result.error.message}` };
    }

    console.log(`[emailSender] Email sent successfully to=${email} id=${result.data?.id}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[emailSender] Unexpected error sending to=${email}:`, message);
    return { success: false, error: message };
  }
}
