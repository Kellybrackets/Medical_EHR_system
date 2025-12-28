/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Sentry plugin should be added only for production builds
    process.env.NODE_ENV === 'production' &&
      sentryVitePlugin({
        // TODO: Replace with your Sentry auth token
        authToken: 'YOUR_SENTRY_AUTH_TOKEN',
        // TODO: Replace with your Sentry organization slug
        org: 'YOUR_SENTRY_ORG',
        // TODO: Replace with your Sentry project slug
        project: 'YOUR_SENTRY_PROJECT',
      }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    sourcemap: true, // Source map generation must be turned on
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
