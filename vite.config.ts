import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { viteSingleFile } from "vite-plugin-singlefile";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./src/ui",
  plugins: [svgr(), reactRefresh(), viteSingleFile()],
  build: {
    emptyOutDir: true,
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
    outDir: "../../dist",
    rollupOptions: {
      output: {
        manualChunks: () => "everything.js",
      },
    },
  },
});
