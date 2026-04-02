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

describe("single-file bundle", () => {
  it(
    "builds and renders markdown through the release artifact",
    async () => {
      const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "md-render-single-"),
      );
      const inputPath = path.join(tempDir, "article.md");
      const outputPath = path.join(tempDir, "article.wechat.html");
      const fragmentPath = path.join(tempDir, "article.fragment.html");

      await fs.writeFile(
        inputPath,
        [
          "# 单文件测试",
          "",
          "- [x] 已完成",
          "",
          "访问 [OpenAI](https://openai.com)",
          "",
          "公式：$E=mc^2$",
          "",
        ].join("\n"),
      );

      await execFileAsync(npmCommand, ["run", "build:single"], {
        cwd: packageRoot,
        env: process.env,
      });

      await execFileAsync(
        process.execPath,
        [
          path.join(packageRoot, "release/md-render.single.cjs"),
          inputPath,
          "--output",
          outputPath,
          "--fragment-output",
          fragmentPath,
        ],
        {
          cwd: packageRoot,
          env: process.env,
        },
      );

      const [previewHtml, fragmentHtml] = await Promise.all([
        fs.readFile(outputPath, "utf8"),
        fs.readFile(fragmentPath, "utf8"),
      ]);

      expect(previewHtml).toContain(fragmentHtml);
      expect(fragmentHtml).toContain("✅");
      expect(fragmentHtml).toContain('class="footnote-ref"');
      expect(fragmentHtml).toContain("<svg");
    },
    120000,
  );
});
