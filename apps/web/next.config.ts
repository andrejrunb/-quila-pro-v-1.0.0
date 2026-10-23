import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://aframe.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://aframe.io ws://localhost:9000 ws://127.0.0.1:9000 http://localhost:9000 http://127.0.0.1:9000;",
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
