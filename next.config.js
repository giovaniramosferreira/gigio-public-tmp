/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Bloqueia framing (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Evita MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Não vaza URL de origem
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Desativa features desnecessárias
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // HSTS: força HTTPS por 1 ano (incluindo subdomínios)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // XSS protection para browsers legados
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // CSP: permite inline styles (usados extensivamente no projeto) e scripts do Next.js
  // Bloqueia objetos, frames externos e eval
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Next.js requer unsafe-inline/eval em dev; em prod, usar nonce
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.resend.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
