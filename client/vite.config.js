import { execSync } from "child_process";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const fullHash = execSync("git rev-parse HEAD").toString().trim();

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, __dirname), VITE_GIT_HASH: fullHash };

  return {
    root: "./",
    server: {
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
    },
    build: {
      sourcemap: true,
      outDir: path.resolve(__dirname, "../server/public"),
    },
    plugins: [
      react({
        jsxImportSource: "@emotion/react",
        babel: {
          parserOpts: {
            plugins: ["decorators-legacy", "classProperties", "@emotion/babel-plugin"],
          },
        },
      }),
    ],
    esbuild: {
      // REF: https://github.com/vitejs/vite/issues/8644
      logOverride: { "this-is-undefined-in-esm": "silent" },
    },
  };
});