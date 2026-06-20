import crypto from "crypto";

/**
 * Returns the secret used to sign unsubscribe tokens.
 * Prefers UNSUBSCRIBE_SECRET; falls back to CRON_SECRET.
 * Both are already set in .env.local so no new variable is required.
 */
function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    throw new Error(
      "No signing secret found. Set UNSUBSCRIBE_SECRET or CRON_SECRET in your environment."
    );
  }
  return secret;
}

/**
 * Creates an HMAC-SHA256 hex digest of the subscriber UUID.
 * Include this as ?token=<value> alongside ?id=<uuid> in unsubscribe links.
 */
export function signUnsubscribeToken(subscriberId: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(subscriberId)
    .digest("hex");
}

/**
 * Verifies a token against a subscriber ID using a timing-safe comparison.
 * Returns false for any malformed input rather than throwing.
 */
export function verifyUnsubscribeToken(
  subscriberId: string,
  token: string
): boolean {
  try {
    const expected = Buffer.from(signUnsubscribeToken(subscriberId), "hex");
    const received = Buffer.from(token, "hex");
    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
