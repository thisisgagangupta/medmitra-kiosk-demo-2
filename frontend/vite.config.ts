// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// resolve to the frontend copy of react/react-dom to avoid duplicate React instances
const resolveReactAliases = () => {
  const root = __dirname;
  return {
    react: path.resolve(root, "node_modules/react"),
    "react/jsx-runtime": path.resolve(root, "node_modules/react/jsx-runtime"),
    "react-dom": path.resolve(root, "node_modules/react-dom"),
    "react-dom/client": path.resolve(root, "node_modules/react-dom/client"),
  };
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...resolveReactAliases(),
    },
  },
}));
