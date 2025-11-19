/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SCOPES: process.env.SCOPES,
    HOST: process.env.HOST,
    NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },
};

module.exports = nextConfig;

