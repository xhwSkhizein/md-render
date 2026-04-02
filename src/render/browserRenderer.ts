import fs from "node:fs/promises";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { mermaidBrowserScript } from "../generated/runtimeAssets";

const COMMON_CHROME_PATHS = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
} satisfies Record<NodeJS.Platform, string[]>;

const fileExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const detectBrowserExecutable = async (
  explicitPath?: string,
): Promise<string | null> => {
  const envPath =
    explicitPath ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    null;

  if (envPath && (await fileExists(envPath))) {
    return envPath;
  }

  const candidates = COMMON_CHROME_PATHS[process.platform] || [];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  return null;
};

export class BrowserRenderer {
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly browserExecutablePath?: string) {}

  async isAvailable(): Promise<boolean> {
    const executablePath = await detectBrowserExecutable(this.browserExecutablePath);
    return executablePath !== null;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = (async () => {
        const executablePath = await detectBrowserExecutable(
          this.browserExecutablePath,
        );
        if (!executablePath) {
          throw new Error(
            "No Chrome/Edge executable found. Pass --browser <path> to enable Mermaid and PNG rendering.",
          );
        }

        return puppeteer.launch({
          executablePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
      })();
    }

    return this.browserPromise;
  }

  private async withPage<T>(
    callback: (page: Page) => Promise<T>,
  ): Promise<T> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });

    try {
      return await callback(page);
    } finally {
      await page.close();
    }
  }

  async renderSvgToPngDataUrl(
    svgMarkup: string,
    options: {
      background?: string;
      omitBackground?: boolean;
      padding?: number;
    } = {},
  ): Promise<string> {
    return this.withPage(async (page) => {
      const padding = options.padding ?? 0;
      await page.setContent(
        `<!doctype html>
        <html>
          <body style="margin:0;${options.background ? `background:${options.background};` : ""}">
            <div id="root" style="display:inline-block;padding:${padding}px;">${svgMarkup}</div>
          </body>
        </html>`,
      );

      const root = await page.$("#root");
      if (!root) {
        throw new Error("Failed to create SVG render container");
      }

      const pngBuffer = await root.screenshot({
        type: "png",
        omitBackground: options.omitBackground === true,
      });

      return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    });
  }

  async renderMermaidToPngDataUrl(diagram: string): Promise<string> {
    return this.withPage(async (page) => {
      await page.setContent(
        `<!doctype html><html><body style="margin:0;background:#ffffff;"><div id="root"></div></body></html>`,
      );
      await page.addScriptTag({ content: mermaidBrowserScript });

      const svgMarkup = await page.evaluate(async (source) => {
        const mermaidApi = (window as Window & {
          mermaid?: {
            initialize: (options: unknown) => void;
            render: (id: string, diagram: string) => Promise<{ svg: string }>;
          };
        }).mermaid;

        if (!mermaidApi) {
          throw new Error("Mermaid browser bundle not available");
        }

        mermaidApi.initialize({
          startOnLoad: false,
          theme: "base",
          flowchart: {
            htmlLabels: true,
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 50,
          },
          themeVariables: {
            tertiaryColor: "#ffffff00",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Microsoft YaHei", sans-serif',
          },
        });

        const { svg } = await mermaidApi.render(
          `wemd-mermaid-${Date.now()}`,
          source,
        );

        const root = document.getElementById("root");
        if (!root) {
          throw new Error("Mermaid mount node missing");
        }

        root.innerHTML = `<div style="display:inline-block;background:#ffffff;padding:16px;">${svg}</div>`;
        return root.innerHTML;
      }, diagram);

      const root = await page.$("#root");
      if (!root) {
        throw new Error("Failed to mount Mermaid SVG");
      }

      const pngBuffer = await root.screenshot({
        type: "png",
        omitBackground: false,
      });

      return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    });
  }

  async close(): Promise<void> {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise;
    await browser.close();
    this.browserPromise = null;
  }
}
