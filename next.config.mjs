/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large file uploads
  api: {
    bodyParser: false,
  },
  // Webpack config for pdf-parse and tesseract
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas']
    }
    return config
  },
}

export default nextConfig;
