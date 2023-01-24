import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import config from "./rollup.config";

import child_process from "child_process";

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      console.log("test");
      if (server) return;
      server = child_process.spawn("npm", ["run", "start", "--", "--dev"], {
        stdio: ["ignore", "inherit", "inherit"],
        shell: true,
        cwd: "../server"
      });

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "../server/public",
    rollupOptions: config,
    watch: {}
  },
  plugins: [svelte(), serve()]
});
