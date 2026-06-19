import { spawn } from "node:child_process";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const rootDir = process.cwd();
const distClientDir = join(rootDir, "dist", "client");
const nativeWebDir = join(rootDir, "native-web");

const runNodeScript = (scriptPath, args = []) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: rootDir,
      env: {
        ...process.env,
        BUILD_TARGET: "capacitor",
      },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptPath} exited with code ${code}`));
    });
  });

try {
  await runNodeScript(join(rootDir, "node_modules", "vite", "bin", "vite.js"), ["build"]);
  await runNodeScript(join(rootDir, "scripts", "generate-spa-index.mjs"));

  await rm(nativeWebDir, { recursive: true, force: true });
  await mkdir(nativeWebDir, { recursive: true });
  await cp(distClientDir, nativeWebDir, { recursive: true });

  const indexPath = join(nativeWebDir, "index.html");
  const html = await readFile(indexPath, "utf8");

  if (!html.trim()) {
    throw new Error("native-web/index.html is empty.");
  }

  console.log("Capacitor web assets ready in native-web/.");
} catch (error) {
  await mkdir(nativeWebDir, { recursive: true }).catch(() => undefined);
  await access(join(nativeWebDir, "index.html")).catch(async () => {
    await writeFile(
      join(nativeWebDir, "index.html"),
      '<!doctype html><html><head><meta charset="utf-8"><title>Taxy</title></head><body><div id="root"></div></body></html>\n',
    );
  });

  console.error("Failed to build Capacitor web assets:", error);
  process.exitCode = 1;
}