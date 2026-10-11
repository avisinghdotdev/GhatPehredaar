import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { proxy: { "/api": "http://localhost:8000" } },
});
