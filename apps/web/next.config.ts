import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const connectSrc = isDev
  ? "'self' ws://localhost:9000 ws://127.0.0.1:9000 http://localhost:9000 http://127.0.0.1:9000"
  : "'self'";

const nextConfig: NextConfig = {
  transpilePackages: ['@aquila/db', '@aquila/api'],
  serverExternalPackages: ['better-sqlite3'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src ${connectSrc}; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/aluno',
        destination: '/portal/aluno',
        permanent: false,
      },
      {
        source: '/professor',
        destination: '/portal/professor',
        permanent: false,
      },
      {
        source: '/pais',
        destination: '/portal/pais',
        permanent: false,
      },
      {
        source: '/coordenacao',
        destination: '/portal/coordenacao',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
