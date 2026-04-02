import { describe, expect, it } from "vitest";
import { renderMarkdownToWechat } from "../src/index.ts";

describe("renderMarkdownToWechat", () => {
  it(
    "renders a final wechat-compatible fragment and preview html",
    async () => {
    const markdown = `
# 标题

- [x] 已完成

公式：$E=mc^2$

访问 [OpenAI](https://openai.com)

\`\`\`js
console.log("hello")
\`\`\`

\`\`\`mermaid
graph TD
  A --> B
\`\`\`
`;

    const css = `
#wemd {
  color: #222222;
  padding: 0 16px;
}

#wemd p {
  color: #333333;
  margin: 12px 0;
}
`;

    const result = await renderMarkdownToWechat({
      markdown,
      css,
      enableLinkFootnotes: true,
      showMacBar: true,
    });

    expect(result.fragmentHtml).toContain("✅");
    expect(result.fragmentHtml).toContain('class="footnote-ref"');
    expect(result.fragmentHtml).toContain("<svg");
    expect(result.fragmentHtml).toContain('<pre class="custom"');
    expect(result.fragmentHtml).toContain('class="mac-sign"');
    expect(result.fragmentHtml).toMatch(/data:image\/png;base64,/);
    expect(result.previewHtml).toContain(result.fragmentHtml);
    },
    30000,
  );
});
