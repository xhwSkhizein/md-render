const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

export const createPreviewDocument = (
  title: string,
  fragmentHtml: string,
): string => {
  const safeTitle = escapeHtml(title);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        background: #f5f7fb;
        color: #0f172a;
        font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .shell {
        max-width: 960px;
        margin: 0 auto;
        padding: 24px;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 12px 16px;
        margin-bottom: 20px;
        border: 1px solid #d8dee9;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(12px);
      }
      .toolbar button {
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        background: #07c160;
        color: #ffffff;
        font: inherit;
        cursor: pointer;
      }
      .toolbar code {
        padding: 2px 6px;
        border-radius: 6px;
        background: #eef2f7;
      }
      .status {
        color: #475569;
      }
      .canvas {
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
        padding: 28px 20px;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="toolbar">
        <button type="button" id="copy-button">复制富文本</button>
        <span class="status" id="copy-status">打开这个文件后，点击按钮或手动选中文章区域复制。</span>
      </div>
      <article class="canvas" id="article-root">${fragmentHtml}</article>
    </main>
    <script>
      (() => {
        const button = document.getElementById("copy-button");
        const status = document.getElementById("copy-status");
        const article = document.getElementById("article-root");

        if (!button || !status || !article) return;

        button.addEventListener("click", () => {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(article);
          selection.removeAllRanges();
          selection.addRange(range);

          let copied = false;
          try {
            copied = document.execCommand("copy");
          } catch (_error) {
            copied = false;
          }

          selection.removeAllRanges();
          status.textContent = copied
            ? "已复制富文本，可以直接粘贴到微信公众号。"
            : "浏览器拒绝自动复制，请手动选中文章区域再复制。";
        });
      })();
    </script>
  </body>
</html>`;
};
