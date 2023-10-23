import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import chokidar from "chokidar";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { join, basename, sep } from 'node:path';

const dev = process.argv.includes("dev");

const outdir = dev ? "dev" : "build";
const htmlfile = "index.html";

/** @type {esbuild.BuildOptions} */
const config = {
  entryPoints: ["src/style.scss"],
  outdir,
  bundle: true,
  plugins: [sassPlugin()],
  logLevel: "info"
};

const ctx = await esbuild.context(config);

const sleep = (delay) => new Promise(res => setTimeout(res, delay));

const copyHTML = () => copyFile(`src/${htmlfile}`, `${outdir}/${htmlfile}`);

if (dev) {
  await ctx.watch();
  const { host, port } = await ctx.serve({
    servedir: "dev",
    port: 8080
  });
  console.log("[esbuild] start watch");

  const watcher = chokidar.watch("./src/index.html");
  await copyHTML();
  watcher.on("change", async () => {
    await sleep(10);
    await copyHTML();
    await ctx.rebuild();
    console.log("[chokidar] changed");
  });
  console.log("[chokidar] start watch");
} else {
  await ctx.rebuild();
  await copyHTML();
  process.exit();
}