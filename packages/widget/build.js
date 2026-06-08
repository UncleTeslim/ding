import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/widget.js",
  bundle: true,
  minify: !watch,
  sourcemap: watch,
  target: "es2017",
  format: "iife",
  platform: "browser",
  legalComments: "none"
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching widget...");
} else {
  await esbuild.build(options);
}
