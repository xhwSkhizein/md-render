import { Window as HappyDomWindow } from "happy-dom";

type GlobalKey =
  | "window"
  | "document"
  | "navigator"
  | "Node"
  | "NodeFilter"
  | "HTMLElement"
  | "HTMLImageElement"
  | "SVGElement"
  | "DOMParser"
  | "XMLSerializer"
  | "CSSRule"
  | "CSSStyleRule"
  | "getComputedStyle";

const GLOBAL_KEYS: GlobalKey[] = [
  "window",
  "document",
  "navigator",
  "Node",
  "NodeFilter",
  "HTMLElement",
  "HTMLImageElement",
  "SVGElement",
  "DOMParser",
  "XMLSerializer",
  "CSSRule",
  "CSSStyleRule",
  "getComputedStyle",
];

export interface DomEnvironment {
  window: Window & typeof globalThis;
  document: Document;
}

export async function withDomEnvironment<T>(
  run: (environment: DomEnvironment) => Promise<T> | T,
): Promise<T> {
  const window = new HappyDomWindow({
    url: "https://wechat-md-render.local/",
  }) as Window & typeof globalThis;
  window.document.write("<!doctype html><html><head></head><body></body></html>");
  window.document.close();
  const previous = new Map<GlobalKey, unknown>();

  for (const key of GLOBAL_KEYS) {
    previous.set(key, (globalThis as Record<string, unknown>)[key]);
  }

  const inject = (key: GlobalKey, value: unknown) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  };

  inject("window", window);
  inject("document", window.document);
  inject("navigator", window.navigator);
  inject("Node", window.Node);
  inject("NodeFilter", window.NodeFilter);
  inject("HTMLElement", window.HTMLElement);
  inject("HTMLImageElement", window.HTMLImageElement);
  inject("SVGElement", window.SVGElement);
  inject("DOMParser", window.DOMParser);
  inject("XMLSerializer", window.XMLSerializer);
  inject("CSSRule", window.CSSRule);
  inject("CSSStyleRule", window.CSSStyleRule);
  inject("getComputedStyle", window.getComputedStyle.bind(window));

  try {
    return await run({
      window: window as Window & typeof globalThis,
      document: window.document,
    });
  } finally {
    for (const key of GLOBAL_KEYS) {
      const value = previous.get(key);
      if (typeof value === "undefined") {
        delete (globalThis as Record<string, unknown>)[key];
      } else {
        inject(key, value);
      }
    }
    window.close();
  }
}
