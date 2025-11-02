/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack config cho Next.js 16+
  turbopack: {
    // Turbopack tự động hỗ trợ WASM, không cần config thêm
  },
  // Webpack config cho production build (fallback nếu cần)
  webpack: (config, { isServer }) => {
    // Fix WASM files cho @meshsdk/core (cho production build)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
}

export default nextConfig