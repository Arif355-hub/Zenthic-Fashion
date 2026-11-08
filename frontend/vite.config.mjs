import { defineConfig } from "vitest/config";
import { transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

const transformJsxInJs = () => ({
  name: "transform-jsx-in-js",
  enforce: "pre",

  async transform(code, id) {
    if (!id.endsWith(".js") || id.includes("/node_modules/")) {
      return null;
    }

    return await transformWithOxc(code, id, {
      lang: "jsx",
    });
  },
});

export default defineConfig({
  plugins: [transformJsxInJs(), react()],

  optimizeDeps: {
    noDiscovery: true,
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
    ],
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
});