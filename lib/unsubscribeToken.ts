import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// UNSUBSCRIBE TOKEN
//
// Here's the threat we're defending against:
//
// Email clients, corporate firewalls, and security bots routinely "prefetch"
// every URL inside an email to scan for malware. If our unsubscribe link was
// a simple GET request — e.g. /api/unsubscribe?id=abc123 — a bot would
// silently unsubscribe the user before they ever opened the email. This
// isn't hypothetical; it's documented Gmail behaviour with certain security
// extensions enabled.
//
// Our solution: every unsubscribe link is signed with HMAC-SHA256.
// The link carries two parameters: the subscriber's UUID and a cryptographic
// token derived from it. Without knowing the secret key (which lives only
// on our servers), nobody can forge a valid unsubscribe URL.
//
// Additionally, we compare tokens using crypto.timingSafeEqual — a function
// that always takes the same amount of time regardless of how many characters
// match. This prevents "timing attacks" where an attacker could guess tokens
// byte-by-byte by measuring how quickly we reject them.
//
// References:
//   HMAC: https://en.wikipedia.org/wiki/HMAC
//   Timing attacks: https://codahale.com/a-lesson-in-timing-attacks/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves the signing secret from environment variables.
 *
 * We prefer UNSUBSCRIBE_SECRET (a dedicated key) but fall back to CRON_SECRET
 * so that existing deployments don't need a new variable just for this feature.
 * Either way, the secret must be high-entropy — at least 32 random bytes.
 */
function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    throw new Error(
      "[unsubscribeToken] No signing secret found. " +
      "Set UNSUBSCRIBE_SECRET or CRON_SECRET in your environment variables. " +
      "This is required to generate tamper-proof unsubscribe links."
    );
  }
  return secret;
}

/**
 * Signs a subscriber UUID and returns a hex-encoded HMAC-SHA256 digest.
 *
 * This token is embedded in every unsubscribe link we send. Without
 * knowing the signing secret, an attacker cannot forge a valid token
 * for any subscriber ID — even if they know the UUID.
 *
 * @example
 * const token = signUnsubscribeToken("e5297620-4023-45b2-84c1-509bcbb7bc37");
 * // → "7f83b1657ff1f..."  (64-char hex string)
 */
export function signUnsubscribeToken(subscriberId: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(subscriberId)
    .digest("hex");
}

/**
 * Verifies that a token is a valid HMAC signature for the given subscriber ID.
 *
 * Uses crypto.timingSafeEqual to prevent timing side-channel attacks.
 * Returns false for any malformed input rather than throwing — so callers
 * don't need try/catch and we don't accidentally surface internal details
 * in error responses.
 */
export function verifyUnsubscribeToken(
  subscriberId: string,
  token: string
): boolean {
  try {
    const expected = Buffer.from(signUnsubscribeToken(subscriberId), "hex");
    const received = Buffer.from(token, "hex");

    // Lengths must match before timingSafeEqual (it throws on mismatched lengths)
    if (expected.length !== received.length) return false;

    return crypto.timingSafeEqual(expected, received);
  } catch {
    // Swallow malformed hex, null bytes, or any other unexpected input
    return false;
  }
}
