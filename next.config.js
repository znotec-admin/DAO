/** @type {import('next').NextConfig} */
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = '1';

const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';
const isWindows = process.platform === 'win32';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const watermark = require("./public/assets/images/watermark.svg");
const noise = require("./public/assets/images/noise.svg");

const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transpilePackages: ['wagmi', 'viem', '@wagmi/core', '@wagmi/connectors', '@walletconnect/ethereum-provider'],
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  env: {
    // NEXT_PUBLIC_WATERMARK_BG: watermark,
    NEXT_PUBLIC_NOISE_BG: noise,
    NEXT_PUBLIC_APP_NAME: 'FolioDAO',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/',
    NEXT_PUBLIC_NETWORK_CHAIN_ID: process.env.NEXT_PUBLIC_NETWORK_CHAIN_ID || '137',
    NEXT_PUBLIC_NETWORK_CHAIN_NAME: process.env.NEXT_PUBLIC_NETWORK_CHAIN_NAME || 'polygon-mainnet',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/uploads/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/dao', destination: '/vote', permanent: false },
      { source: '/voting', destination: '/vote', permanent: false },
      { source: '/rewards', destination: '/reward', permanent: false },
      { source: '/howitworks', destination: '/how-it-works', permanent: false },
      { source: '/white-papers', destination: '/whitepaper', permanent: false },
      { source: '/whitepapers', destination: '/whitepaper', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/healthz', destination: '/api/health' },
    ];
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  webpack: (config, { isServer, dev }) => {
    if (dev && isWindows) {
      config.cache = { type: 'memory' };
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        encoding: false,
      };
    }

    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
    }

    const emptyModule = path.join(__dirname, 'utils/emptyModule.js');
    const connectorsRoot = path.join(__dirname, 'node_modules/@wagmi/connectors/dist/esm');

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
      '@base-org/account': emptyModule,
      '@react-native-async-storage/async-storage': emptyModule,
      '@safe-global/safe-apps-sdk': emptyModule,
      '@safe-global/safe-apps-provider': emptyModule,
      'folio/coinbaseWallet': path.join(connectorsRoot, 'coinbaseWallet.js'),
      'folio/walletConnect': path.join(connectorsRoot, 'walletConnect.js'),
    };

    config.module.rules.push({
      test: /[\\/]node_modules[\\/]viem[\\/]_cjs[\\/].*\.js$/,
      use: path.join(__dirname, 'utils/stripImportMetaLoader.js'),
    });

    return config;
  },
};

module.exports = nextConfig;
