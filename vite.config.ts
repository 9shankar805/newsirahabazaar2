import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from node_modules and parent directories
      allow: [
        // Allow serving files from the project root
        process.cwd(),
        // Allow serving files from node_modules
        'node_modules',
        // Allow serving files from the parent directory
        '..',
        // Explicitly allow the problematic path
        'C:/Users/shekh/Downloads/EcommercePlatformfist12-1111-1jh-1111-21-1/EcommercePlatformfist12-1111-1jh-1111-21-1/node_modules',
      ],
    },
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
