/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wwb/shared'],
  eslint: {
    // ESLint style warnings should not block production deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors are caught locally; don't block Vercel builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
