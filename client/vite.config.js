import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    server: {
      port: 3000,
      // In development, API calls go to the Express server.
      proxy: {
        "/api": { target: env.VITE_DEV_API_PROXY || "http://localhost:5100", changeOrigin: true },
      },
    },
    preview: { port: 3000 },
    // Pages are lazy-loaded, so by default Vite only discovers their dependencies when a page
    // is first opened, then re-bundles mid-session. An open tab can end up with two copies of
    // React ("Invalid hook call"). Scanning every source file up front avoids that.
    optimizeDeps: {
      entries: ["index.html", "src/**/*.{js,jsx}"],
      include: ["libphonenumber-js", "libphonenumber-js/mobile/examples"],
    },
    build: {
      rolldownOptions: {
        output: {
          // Long-lived vendor chunks so returning visitors can reuse them from cache.
          codeSplitting: {
            groups: [
              { name: "react-vendor", test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
              { name: "motion", test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
              { name: "radix", test: /node_modules[\\/]@radix-ui[\\/]/ },
            ],
          },
        },
      },
    },
  };
});
