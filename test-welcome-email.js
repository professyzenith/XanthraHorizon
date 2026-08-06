const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Copy the exact same function from emailSender.ts to test it locally
function htmlEscape(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWelcomeHTML(deliveryTime, timezone, unsubscribeUrl) {
  const safeTime  = htmlEscape(deliveryTime);
  const safeTz    = htmlEscape(timezone);
  const safeUnsub = htmlEscape(unsubscribeUrl);
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || "https://www.xanthra.space";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Xanthra Horizon</title>
</head>
<body style="margin:0;padding:0;background-color:#0f9388;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f9388;padding:40px 20px;">
    <tr><td align="center">
      <!-- Main Email Container -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.15);">
        
        <!-- Header Section -->
        <tr><td style="padding:40px 20px 20px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#F26252;letter-spacing:-0.5px;text-transform:lowercase;">xanthra</h1>
          <h2 style="margin:16px 0 0;font-size:20px;font-weight:500;color:#333333;">Welcome to the Horizon!</h2>
        </td></tr>

        <!-- Graphic / Illustration Area -->
        <tr><td style="padding:20px 20px 0;text-align:center;">
          <a href="${appUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
            <img src="${appUrl}/welcome-illustration.png" alt="Welcome to Xanthra Horizon" width="280" style="display:block;margin:0 auto;max-width:100%;height:auto;border:none;outline:none;" />
          </a>
        </td></tr>

        <!-- Inner Content Card -->
        <tr><td style="padding:30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff;border:1px solid #f0f0f0;border-radius:4px;padding:32px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <tr><td>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#555555;">
                Congratulations on subscribing to <strong>Xanthra Horizon</strong>. You are now securely plugged into the global nervous system of premium intelligence.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#555555;">
                So what&apos;s next? Your customized daily intelligence brief is locked in for <strong>${safeTime} (${safeTz})</strong>. Before your first brief arrives, be sure to whitelist this email address so you never miss an update!
              </p>
              <div style="text-align:center;margin-top:32px;">
                <a href="${appUrl}" style="background-color:#0f9388;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:15px;font-weight:600;display:inline-block;">View the Horizon</a>
              </div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Questions Section -->
        <tr><td style="padding:20px 30px 20px;text-align:center;">
          <h3 style="margin:0 0 8px;font-size:15px;font-weight:600;color:#333333;">Have questions?</h3>
          <a href="${appUrl}" style="color:#0f9388;text-decoration:underline;font-weight:600;font-size:14px;">Contact our team</a>
          <p style="margin:8px 0 0;font-size:13px;color:#777777;">Our intelligence team is standing by and ready to help.</p>
        </td></tr>

        <!-- Footer Section -->
        <tr><td style="padding:30px 30px 40px;text-align:center;">
          <h4 style="margin:0 0 4px;font-size:14px;font-weight:700;color:#333333;">Xanthra Horizon</h4>
          <p style="margin:0 0 16px;font-size:13px;color:#777777;">Global Intelligence Network</p>
          <a href="${appUrl}" style="color:#0f9388;text-decoration:underline;font-size:14px;font-weight:600;">xanthra.space</a>
          <p style="margin:24px 0 0;font-size:12px;color:#a0a0a0;">
            No longer want to receive these emails?<br/>
            <a href="${safeUnsub}" style="color:#a0a0a0;text-decoration:underline;">Unsubscribe securely</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendTestEmail() {
  const html = buildWelcomeHTML("7:00 PM", "Asia/Kolkata", "https://www.xanthra.space/unsubscribe?id=test&token=test");
  
  const result = await resend.emails.send({
    from: `Xanthra Horizon <${process.env.RESEND_FROM_EMAIL}>`,
    to: "professy69@gmail.com",
    subject: "NEW THEME TEST — You're in the Horizon. Welcome. ⚡",
    html,
  });

  console.log("Result:", result);
}

sendTestEmail();
