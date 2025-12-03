import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'kjsafjeeledmjikxkmrr.supabase.co',
        pathname: '/**',
      },
    ],
  },
  // Evitar redirects em rotas de API (necessário para webhooks externos)
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
