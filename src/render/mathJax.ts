import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

interface MathJaxContext {
  adaptor: ReturnType<typeof liteAdaptor>;
  html: ReturnType<typeof mathjax.document>;
}

let mathJaxContext: MathJaxContext | null = null;

const SVG_PATTERN = /<svg\b[\s\S]*?<\/svg>/i;
const WIDTH_PATTERN = /\swidth="([^"]+)"/i;
const STYLE_PATTERN = /\sstyle="([^"]*)"/i;
const XMLNS_PATTERN = /\sxmlns=/i;

const appendInlineStyle = (svgHtml: string, extraStyle: string): string => {
  const normalizedExtra = extraStyle.trim().endsWith(";")
    ? extraStyle.trim()
    : `${extraStyle.trim()};`;

  if (STYLE_PATTERN.test(svgHtml)) {
    return svgHtml.replace(STYLE_PATTERN, (_match, currentStyle: string) => {
      const trimmedCurrentStyle = currentStyle.trim();
      const separator =
        trimmedCurrentStyle.length > 0 && !trimmedCurrentStyle.endsWith(";")
          ? ";"
          : "";
      return ` style="${trimmedCurrentStyle}${separator}${normalizedExtra}"`;
    });
  }

  return svgHtml.replace(/<svg\b/i, `<svg style="${normalizedExtra}"`);
};

const createMathJaxContext = (): MathJaxContext => {
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);

  const tex = new TeX({
    packages: AllPackages,
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
    tags: "ams",
  });
  const svg = new SVG({
    fontCache: "none",
  });
  const html = mathjax.document("", {
    InputJax: tex,
    OutputJax: svg,
  });

  return {
    adaptor,
    html,
  };
};

const getMathJax = async (): Promise<MathJaxContext> => {
  if (!mathJaxContext) {
    mathJaxContext = createMathJaxContext();
  }

  return mathJaxContext;
};

export const hasMathFormula = (content: string): boolean => {
  return /\$[^$]+\$/.test(content);
};

export const initializeMathJax = async (): Promise<void> => {
  await getMathJax();
};

export const renderMathJaxSvg = (
  latex: string,
  display: boolean,
): string | null => {
  try {
    if (!mathJaxContext) {
      return null;
    }

    const container = mathJaxContext.html.convert(latex, { display });
    const containerHtml = mathJaxContext.adaptor.outerHTML(container);
    const svgMatch = containerHtml.match(SVG_PATTERN);
    if (!svgMatch) return null;

    let svgHtml = svgMatch[0];
    const width = svgHtml.match(WIDTH_PATTERN)?.[1];

    svgHtml = svgHtml.replace(WIDTH_PATTERN, "");
    svgHtml = appendInlineStyle(
      svgHtml,
      "display:initial;max-width:300vw !important;flex-shrink:0;",
    );

    if (width) {
      svgHtml = appendInlineStyle(svgHtml, `width:${width};`);
    }

    if (!XMLNS_PATTERN.test(svgHtml)) {
      svgHtml = svgHtml.replace(
        /<svg\b/i,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }

    return svgHtml;
  } catch (error) {
    console.error("MathJax render error:", error);
    return null;
  }
};
