import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 3002,
    open: true, // Automatically open the browser
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL, // Use environment variable
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""), // Remove /api prefix
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    // commonjsOptions: {
    // },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: "dist",
    sourcemap: process.env.NODE_ENV === "production",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src", // Simplify imports with alias
    },
  },
});
