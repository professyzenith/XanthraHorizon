/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin Turbopack's root to this project directory so it doesn't
  // pick up the stray package-lock.json in the user home directory.
  turbopack: {
    root: __dirname,
  },
  // Security headers applied to every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Minimal referrer info sent cross-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not needed by this app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Force HTTPS in browsers
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content Security Policy — restricts what the browser loads
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js needs inline styles + scripts during hydration
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Allow images from GitHub (crew avatars in readme don't affect the app)
              "img-src 'self' data: blob:",
              // API calls only to self + Supabase
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
