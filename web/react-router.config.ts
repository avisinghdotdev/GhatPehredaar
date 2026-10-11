import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  // No prerender: the language comes from the URL, so a prerendered page would hydrate with mismatched text.
  ssr: false,
  prerender: false,
} satisfies Config;
