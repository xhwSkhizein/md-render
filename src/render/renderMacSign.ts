import { BrowserRenderer } from "./browserRenderer";

const isNumericSize = (value: string): boolean => /^\d+(\.\d+)?$/.test(value);

export const renderMacSignSvgsToImages = async (
  container: HTMLElement,
  browserRenderer?: BrowserRenderer,
): Promise<void> => {
  const svgs = Array.from(
    container.querySelectorAll<SVGElement>(".mac-sign > svg"),
  );

  if (svgs.length === 0) return;

  await Promise.all(
    svgs.map(async (svg) => {
      try {
        if (!browserRenderer) {
          return;
        }

        const pngDataUrl = await browserRenderer.renderSvgToPngDataUrl(
          svg.outerHTML,
          {
            omitBackground: true,
          },
        );
        const img = container.ownerDocument.createElement("img");
        const width = svg.getAttribute("width") || "45";
        const height = svg.getAttribute("height") || "13";

        img.src = pngDataUrl;
        img.alt = "";
        img.style.display = "block";
        img.style.width = isNumericSize(width) ? `${width}px` : width;
        img.style.height = isNumericSize(height) ? `${height}px` : height;

        svg.replaceWith(img);
      } catch (error) {
        console.warn("mac-sign SVG 转 PNG 失败，保留原 SVG", error);
      }
    }),
  );
};
