import { createMarkdownParser } from "../core/MarkdownParser";
import { processHtml } from "../core/ThemeProcessor";
import { loadKatexCss } from "./katexCss";
import { convertLinksToFootnotes } from "../utils/linkFootnote";
import { resolveInlineStyleVariablesForCopy } from "./inlineStyleVarResolver";
import {
  materializeCounterPseudoContent,
  stripCounterPseudoRules,
} from "./wechatCounterCompat";
import { expandCSSVariables } from "./cssVariableExpander";
import {
  normalizeCopyContainer,
  stripCopyMetadata,
} from "./wechatCopyNormalizer";
import { renderMermaidBlocks } from "./mermaidRenderer";
import { renderTableBlocks } from "./wechatTableRenderer";
import { renderMacSignSvgsToImages } from "./renderMacSign";
import { withDomEnvironment } from "./domEnvironment";
import { createPreviewDocument } from "../templates/previewDocument";
import { hasMathFormula, initializeMathJax } from "./mathJax";
import { BrowserRenderer } from "./browserRenderer";

export interface RenderMarkdownToWechatOptions {
  markdown: string;
  css: string;
  enableLinkFootnotes?: boolean;
  showMacBar?: boolean;
  previewTitle?: string;
  browserExecutablePath?: string;
}

export interface RenderMarkdownToWechatResult {
  fragmentHtml: string;
  previewHtml: string;
  plainText: string;
}

const convertCheckboxesToEmoji = (html: string): string => {
  let result = html.replace(/<input[^>]*checked[^>]*>/gi, "✅&nbsp;");
  result = result.replace(
    /<input[^>]*type=["']checkbox["'][^>]*>/gi,
    "⬜&nbsp;",
  );
  return result;
};

const buildCopyCss = async (themeCss: string): Promise<string> => {
  const katexCss = await loadKatexCss();
  if (!themeCss) return katexCss;
  return `${expandCSSVariables(themeCss)}\n${katexCss}`;
};

const getRenderedPlainText = (container: HTMLElement): string => {
  return container.textContent || "";
};

export async function renderMarkdownToWechat(
  options: RenderMarkdownToWechatOptions,
): Promise<RenderMarkdownToWechatResult> {
  if (hasMathFormula(options.markdown)) {
    await initializeMathJax();
  }

  const parser = createMarkdownParser({
    showMacBar: options.showMacBar === true,
  });
  const rawHtml = parser.render(options.markdown);
  const sourceHtml =
    options.enableLinkFootnotes === false
      ? rawHtml
      : convertLinksToFootnotes(rawHtml);
  const themedCss = await buildCopyCss(options.css);
  const sanitizedCss = stripCounterPseudoRules(themedCss);

  return withDomEnvironment(async ({ document }) => {
    const browserRenderer = new BrowserRenderer(options.browserExecutablePath);

    const materializedHtml = materializeCounterPseudoContent(
      sourceHtml,
      themedCss,
    );
    const styledHtml = processHtml(materializedHtml, sanitizedCss, true, true);
    const resolvedHtml = resolveInlineStyleVariablesForCopy(styledHtml);
    const finalHtml = convertCheckboxesToEmoji(resolvedHtml);

    const container = document.createElement("div");
    container.innerHTML = finalHtml;

    try {
      await renderMermaidBlocks(container, browserRenderer);
      await renderTableBlocks(container);
      await renderMacSignSvgsToImages(container, browserRenderer);
      normalizeCopyContainer(container);
      stripCopyMetadata(container);

      const fragmentHtml = container.innerHTML;
      const previewHtml = createPreviewDocument(
        options.previewTitle || "WeChat Markdown Render",
        fragmentHtml,
      );

      return {
        fragmentHtml,
        previewHtml,
        plainText: getRenderedPlainText(container),
      };
    } finally {
      await browserRenderer.close();
    }
  });
}
