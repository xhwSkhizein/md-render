import { BrowserRenderer } from "./browserRenderer";

export const renderMermaidBlocks = async (
  container: HTMLElement,
  browserRenderer?: BrowserRenderer,
): Promise<void> => {
  const mermaidBlocks = Array.from(container.querySelectorAll("pre.mermaid"));
  if (mermaidBlocks.length === 0) return;

  if (!browserRenderer) {
    throw new Error(
      "Mermaid rendering requires Chrome/Edge. Pass --browser <path> or install Chrome.",
    );
  }

  for (const block of mermaidBlocks) {
    const diagram = block.textContent ?? "";
    if (!diagram.trim()) continue;

    try {
      const pngDataUrl = await browserRenderer.renderMermaidToPngDataUrl(
        diagram,
      );

      const figure = container.ownerDocument.createElement("div");
      figure.style.margin = "1em 0";
      figure.style.textAlign = "center";

      const img = container.ownerDocument.createElement("img");
      img.src = pngDataUrl;
      img.alt = diagram.slice(0, 80);
      img.style.width = "100%";
      img.style.display = "block";
      img.style.margin = "0 auto";
      img.style.maxWidth = "100%";
      img.style.height = "auto";

      figure.appendChild(img);
      block.replaceWith(figure);
    } catch (error) {
      console.error("[md-render] Mermaid render failed:", error);
    }
  }
};
