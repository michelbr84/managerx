import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@managerx/core-sim": path.resolve(__dirname, "../../packages/core-sim/src"),
      "@managerx/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});

