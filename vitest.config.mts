import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // The real package throws outside the react-server condition.
      "server-only": new URL("./tests/stubs/empty.ts", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // PGlite boots a WASM Postgres; give the DB tests room on slow machines.
    testTimeout: 30_000,
  },
});
