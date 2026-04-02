import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(
  "/Users/hongv/workspace/post-wechat/md-render",
);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const packageDir = path.join(packageRoot, "release", "md-render");
const packageArchive = path.join(
  packageRoot,
  "release",
  "md-render.zip",
);

describe("release package", () => {
  it(
    "creates a distributable folder and zip archive that can render markdown",
    async () => {
      await execFileAsync(npmCommand, ["run", "package:release"], {
        cwd: packageRoot,
        env: process.env,
      });

      await expect(
        fs.access(path.join(packageDir, "md-render.single.cjs")),
      ).resolves.toBeUndefined();
      await expect(fs.access(path.join(packageDir, "README.md"))).resolves.toBeUndefined();
      await expect(fs.access(path.join(packageDir, "themes", "default.css"))).resolves.toBeUndefined();
      await expect(fs.access(packageArchive)).resolves.toBeUndefined();

      const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "md-render-package-"),
      );
      const inputPath = path.join(tempDir, "article.md");
      const outputPath = path.join(tempDir, "article.wechat.html");
      const fragmentPath = path.join(tempDir, "article.fragment.html");

      await fs.writeFile(
        inputPath,
        [
          "# 打包测试",
          "",
          "- [x] 已完成",
          "",
          "访问 [OpenAI](https://openai.com)",
          "",
        ].join("\n"),
      );

      await execFileAsync(
        process.execPath,
        [
          path.join(packageDir, "md-render.single.cjs"),
          inputPath,
          "--output",
          outputPath,
          "--fragment-output",
          fragmentPath,
        ],
        {
          cwd: tempDir,
          env: process.env,
        },
      );

      const fragmentHtml = await fs.readFile(fragmentPath, "utf8");
      expect(fragmentHtml).toContain("✅");
      expect(fragmentHtml).toContain('class="footnote-ref"');
    },
    120000,
  );
});
