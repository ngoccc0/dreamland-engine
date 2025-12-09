import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true
});

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  transpilePackages: [
    '@opentelemetry/instrumentation-winston',
    '@opentelemetry/exporter-jaeger'
  ],
  webpack: (config, { dev, isServer }) => {
    // Optimize chunks for production client builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 10000,
          maxSize: 244000,
        }
      };
    }

    // Handle Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url/'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert/'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
      };
    }

    // Handle specific modules that should be excluded from client bundle
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /handlebars|\.hbs$/,
          loader: 'null-loader',
          include: [/node_modules\/handlebars/],
        },
      ],
    };

    // External modules that should not be bundled
    if (!isServer) {
      config.externals = {
        ...config.externals,
        handlebars: 'handlebars',
      };
    }

    return config;
  }
};

export default withPWA(nextConfig);