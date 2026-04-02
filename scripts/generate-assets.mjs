import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = path.join(packageRoot, "src", "generated");
const generatedPath = path.join(generatedDir, "runtimeAssets.ts");

const readFile = async (filePath) => fs.readFile(filePath, "utf8");

const resolveModulePath = (request) => require.resolve(request);

const defaultThemePath = path.join(packageRoot, "themes", "default.css");
const katexCssPath = resolveModulePath("katex/dist/katex.min.css");
const mermaidBrowserPath = resolveModulePath("mermaid/dist/mermaid.min.js");

const [defaultThemeCss, katexCss, mermaidBrowserScript] = await Promise.all([
  readFile(defaultThemePath),
  readFile(katexCssPath),
  readFile(mermaidBrowserPath),
]);

const content = `export const defaultThemeCss = ${JSON.stringify(defaultThemeCss)};

export const katexCss = ${JSON.stringify(katexCss)};

export const mermaidBrowserScript = ${JSON.stringify(mermaidBrowserScript)};
`;

await fs.mkdir(generatedDir, { recursive: true });
await fs.writeFile(generatedPath, content, "utf8");
console.log(generatedPath);
