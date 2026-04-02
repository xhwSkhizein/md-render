import fs from "node:fs/promises";
import path from "node:path";
import { renderMarkdownToWechat } from "./index";
import { defaultThemeCss } from "./generated/runtimeAssets";

interface CliOptions {
  inputPath: string;
  cssPath?: string;
  outputPath?: string;
  fragmentOutputPath?: string;
  writeStdout: boolean;
  enableLinkFootnotes: boolean;
  showMacBar: boolean;
  browserExecutablePath?: string;
}

const usage = `Usage:
  wechat-md-render <input.md> [options]

Options:
  --css <path>                 CSS file path. Default: embedded default theme
  --output <path>              Preview HTML output path
  --fragment-output <path>     Raw fragment HTML output path
  --stdout                     Print raw fragment HTML to stdout
  --no-footnotes               Disable external link footnotes
  --show-mac-bar               Render code block mac bar
  --browser <path>             Chrome/Edge executable path for Mermaid rendering
  --help                       Show this help message
`;

const resolveDefaultOutputPath = (inputPath: string): string => {
  const parsed = path.parse(path.resolve(inputPath));
  return path.join(parsed.dir, `${parsed.name}.wechat.html`);
};

const parseArgs = (argv: string[]): CliOptions => {
  if (argv.length === 0 || argv.includes("--help")) {
    process.stdout.write(`${usage}\n`);
    process.exit(0);
  }

  const options: CliOptions = {
    inputPath: "",
    writeStdout: false,
    enableLinkFootnotes: true,
    showMacBar: false,
  };

  const readValue = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--") && !options.inputPath) {
      options.inputPath = arg;
      continue;
    }

    switch (arg) {
      case "--css":
        options.cssPath = readValue(index, "--css");
        index += 1;
        break;
      case "--output":
        options.outputPath = readValue(index, "--output");
        index += 1;
        break;
      case "--fragment-output":
        options.fragmentOutputPath = readValue(index, "--fragment-output");
        index += 1;
        break;
      case "--stdout":
        options.writeStdout = true;
        break;
      case "--no-footnotes":
        options.enableLinkFootnotes = false;
        break;
      case "--show-mac-bar":
        options.showMacBar = true;
        break;
      case "--browser":
        options.browserExecutablePath = readValue(index, "--browser");
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.inputPath) {
    throw new Error("Missing input markdown path");
  }

  if (!options.outputPath) {
    options.outputPath = resolveDefaultOutputPath(options.inputPath);
  }

  return options;
};

const main = async () => {
  try {
    const options = parseArgs(process.argv.slice(2));
    const markdown = await fs.readFile(path.resolve(options.inputPath), "utf8");
    const css = options.cssPath
      ? await fs.readFile(path.resolve(options.cssPath), "utf8")
      : defaultThemeCss;

    const result = await renderMarkdownToWechat({
      markdown,
      css,
      enableLinkFootnotes: options.enableLinkFootnotes,
      showMacBar: options.showMacBar,
      previewTitle: path.basename(options.inputPath),
      browserExecutablePath: options.browserExecutablePath,
    });

    await fs.mkdir(path.dirname(path.resolve(options.outputPath!)), {
      recursive: true,
    });
    await fs.writeFile(path.resolve(options.outputPath!), result.previewHtml);

    if (options.fragmentOutputPath) {
      await fs.mkdir(path.dirname(path.resolve(options.fragmentOutputPath)), {
        recursive: true,
      });
      await fs.writeFile(
        path.resolve(options.fragmentOutputPath),
        result.fragmentHtml,
      );
    }

    if (options.writeStdout) {
      process.stdout.write(result.fragmentHtml);
    }

    if (!options.writeStdout) {
      process.stderr.write(
        `Preview written to ${path.resolve(options.outputPath!)}\n`,
      );
      if (options.fragmentOutputPath) {
        process.stderr.write(
          `Fragment written to ${path.resolve(options.fragmentOutputPath)}\n`,
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
};

void main();
