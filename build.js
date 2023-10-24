import chokidar from "chokidar";
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import _fs from "fs-extra";
import { join, basename, sep } from 'node:path';
import { sleep } from "./src/lib/sleep.js";

const { readFile, writeFile, copy } = _fs;

const dev = process.argv.includes("dev");
const outdir = dev ? "dev" : "build";

/** @type {esbuild.BuildOptions} */
const config = {
  entryPoints: ["src/style.scss"],
  outdir,
  bundle: true,
  minify: !dev,
  plugins: [sassPlugin()],
  logLevel: "info",
  external: ["img"]
};

const copyHTML = () => copy(`src/index.html`, `${outdir}/index.html`);
const copyImages = () => copy(`src/img`, `${outdir}/img`);

const ctx = await esbuild.context(config);

await Promise.all([copyHTML(), copyImages()]);

if (dev) {
  await ctx.watch();
  await ctx.serve({
    servedir: "dev",
    port: 8080
  });

  console.log("[esbuild] start watch");

  const watcher = chokidar.watch("./src/index.html");
  watcher.on("change", async () => {
    await sleep(10); // If I don't put a little delay before copying, a empty file is loaded. Maybe a Cloud9 spec?

    await copyHTML();
    await ctx.rebuild();

    console.log("[chokidar] changed");
  });

  console.log("[chokidar] start watch");
} else {
  await ctx.rebuild();
  process.exit();
}
