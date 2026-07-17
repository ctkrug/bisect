import { defineConfig } from "vite";

// Relative base + single dist/ output so this can be served from any
// subpath (e.g. apps.charliekrug.com/bisect) with no server-side config.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
});
