import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const clientDir = join(process.cwd(), "dist", "client");
const indexPath = join(clientDir, "index.html");

const toRelativeAssetPath = (html) =>
  html
    .replaceAll('href="/assets/', 'href="./assets/')
    .replaceAll('src="/assets/', 'src="./assets/')
    .replaceAll("url(/assets/", "url(./assets/")
    .replaceAll('href="assets/', 'href="./assets/')
    .replaceAll('src="assets/', 'src="./assets/');

try {
  const originalHtml = await readFile(indexPath, "utf8");
  const html = toRelativeAssetPath(originalHtml);

  if (html.includes('href="/assets/') || html.includes('src="/assets/') || html.includes("url(/assets/")) {
    throw new Error("Capacitor SPA index still contains absolute /assets/ URLs.");
  }

  await writeFile(indexPath, html);
  console.log("Capacitor SPA index verified with relative asset paths.");
} catch (error) {
  console.error("Failed to verify Capacitor SPA index:", error);
  process.exitCode = 1;
}
