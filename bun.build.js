import { build } from "bun"

const result = await build({
  entrypoints: ["./server.js"],
  outdir: "./dist",
  target: "bun",
  minify: true,
  sourcemap: "external",
  external: ["better-sqlite3"],
})

if (!result.success) {
  console.error("Build failed")
  for (const message of result.logs) {
    console.error(message)
  }
  process.exit(1)
}

console.log("Build completed successfully!")
