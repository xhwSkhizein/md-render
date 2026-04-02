import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(packageRoot, "package.json");
const releaseRoot = path.join(packageRoot, "release");
const bundleName = "md-render";
const bundleDir = path.join(releaseRoot, bundleName);
const bundleArchivePath = path.join(releaseRoot, `${bundleName}.zip`);
const singleFilePath = path.join(releaseRoot, "md-render.single.cjs");
const readmePath = path.join(packageRoot, "README.md");
const themesDir = path.join(packageRoot, "themes");

const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

const ensureCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
};

const createZipArchive = () => {
  if (process.platform === "win32") {
    ensureCommand(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path '${bundleDir}\\*' -DestinationPath '${bundleArchivePath}' -Force`,
      ],
      {
        cwd: releaseRoot,
      },
    );
    return;
  }

  ensureCommand(
    "zip",
    ["-r", "-q", bundleArchivePath, bundleName],
    {
      cwd: releaseRoot,
    },
  );
};

await fs.access(singleFilePath);

await fs.rm(bundleDir, { recursive: true, force: true });
await fs.rm(bundleArchivePath, { force: true });
await fs.mkdir(bundleDir, { recursive: true });

await fs.copyFile(singleFilePath, path.join(bundleDir, "md-render.single.cjs"));
await fs.chmod(path.join(bundleDir, "md-render.single.cjs"), 0o755);
await fs.copyFile(readmePath, path.join(bundleDir, "README.md"));
await fs.cp(themesDir, path.join(bundleDir, "themes"), { recursive: true });

const bundledPackageJson = {
  name: "md-render-release",
  version: packageJson.version,
  private: true,
  description: "Standalone release bundle for WeChat Markdown Renderer",
  bin: {
    "md-render": "./md-render.single.cjs",
  },
};

await fs.writeFile(
  path.join(bundleDir, "package.json"),
  `${JSON.stringify(bundledPackageJson, null, 2)}\n`,
);

createZipArchive();

console.log(`Release bundle directory: ${bundleDir}`);
console.log(`Release bundle archive: ${bundleArchivePath}`);
