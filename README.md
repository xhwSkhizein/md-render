# WeChat Markdown Renderer

> 此项目基于 [https://github.com/tenngoxars/WeMD](https://github.com/tenngoxars/WeMD) 构建，感谢 [https://wemd.app/ © WeMD Team](https://wemd.app/)

一个可独立运行的微信公众号 Markdown 渲染工具。

它的目标不是“把 Markdown 转成普通 HTML”，而是尽量复刻 WeMD 网页里“复制到微信公众号”那条链路，直接生成可以粘贴进公众号编辑器的最终富文本 HTML。

这个目录是一个完整独立包：

- 不依赖当前 monorepo 的运行时代码
- 有自己的 `package.json`
- 可以单独安装、构建、运行
- 支持普通 CLI 版和单文件发布版

## 它输出的到底是什么

WeMD 网页点击“复制到微信公众号”时，复制到剪贴板里的核心内容不是 Markdown，也不是带外链 CSS 的页面，而是：

- `text/html`：最终处理后的富文本 HTML 片段
- `text/plain`：同一份内容的纯文本兜底

这个工具对应输出：

- `--fragment-output` 或 `--stdout`
  - 输出最终富文本 HTML 片段
  - 这是最接近网页“复制到微信公众号”时写入剪贴板 `text/html` 的内容
- `--output`
  - 输出一个完整预览页面
  - 页面内置“复制富文本”按钮，打开后可直接复制并粘贴到微信公众号后台

如果你的目标是“和网页复制出来的一模一样”，优先关注 `fragment` 输出。

## 已覆盖能力

- Markdown 基础语法
- 标题、列表、引用、分割线
- GFM 表格
- 任务列表 checkbox 转 emoji
- 代码高亮
- 代码块 mac bar
- Mermaid 渲染为 PNG
- MathJax 公式渲染为 SVG
- 外链脚注
- CSS 变量展开
- CSS counter 物化
- 微信兼容归一化
- 内联样式输出
- 预览页复制按钮

## 与网页复制链路的对应关系

当前独立版复刻的是这条处理流程：

1. Markdown 解析为 HTML
2. 套用主题 CSS
3. 用 `juice` 做样式内联
4. 展开内联样式中的 CSS 变量
5. 将 checkbox 转成 emoji
6. Mermaid 转 PNG
7. 表格做微信兼容强化
8. mac bar SVG 转 PNG
9. 归一化为微信公众号更稳定的 HTML 结构
10. 输出最终 fragment HTML 和预览页

也就是说，这个工具的目标是对齐“复制链路”，不是对齐网页预览 DOM。

## 目录结构

```text
standalone/md-render/
├── src/
│   ├── cli.ts
│   ├── render/
│   ├── core/
│   └── generated/
├── themes/
├── scripts/
├── test/
├── dist/
└── release/
```

关键文件：

- `src/cli.ts`
  - 命令行入口
- `src/render/renderMarkdownToWechat.ts`
  - 主渲染管线
- `themes/default.css`
  - 默认主题
- `dist/cli.js`
  - 普通构建产物
- `release/md-render.single.cjs`
  - 单文件发布版

## 安装

```bash
cd /Users/hongv/workspace/post-wechat/md-render
npm install
```

说明：

- 这里使用的是 `puppeteer-core`
- 它不会自动下载 Chromium
- 如果你要渲染 Mermaid 或代码块 mac bar，需要本机已有 Chrome、Chromium 或 Edge

支持的浏览器传入方式：

- `--browser /path/to/chrome`
- 环境变量 `PUPPETEER_EXECUTABLE_PATH`
- 环境变量 `CHROME_PATH`
- 不传时自动探测常见安装路径

## 快速开始

先构建普通 CLI 版：

```bash
npm run build
```

最简单的用法：

```bash
node dist/cli.js ./article.md
```

默认行为：

- 使用内置的 `default.css`
- 输出到 `./article.wechat.html`
- 不向终端打印 fragment

如果你想同时拿到预览页和最终 fragment：

```bash
node dist/cli.js ./article.md \
  --output ./out/article.wechat.html \
  --fragment-output ./out/article.fragment.html
```

如果你想直接把最终 fragment 打到终端：

```bash
node dist/cli.js ./article.md --stdout
```

如果你要指定主题：

```bash
node dist/cli.js ./article.md \
  --css ./themes/Bauhaus.css \
  --output ./out/article.wechat.html \
  --fragment-output ./out/article.fragment.html
```

如果 Mermaid 无法自动找到浏览器：

```bash
node dist/cli.js ./article.md \
  --browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## 单文件发布版

构建单文件版：

```bash
npm run build:single
```

产物位置：

```text
release/md-render.single.cjs
```

运行方式：

```bash
node release/md-render.single.cjs ./article.md
```

它的特点：

- 只有一个发布文件
- 默认主题已经内嵌
- Mermaid 浏览器脚本已经内嵌
- KaTeX CSS 已内嵌
- 不需要再保留 `node_modules`

需要注意的边界：

- 如果你传 `--css`，对应的 CSS 文件仍然需要单独存在
- 如果输入内容里包含 Mermaid 或代码块 mac bar，需要本机可用 Chrome / Edge
- 单文件版不会内嵌浏览器本体，只会调用本机浏览器可执行文件

一个完整例子：

```bash
node release/md-render.single.cjs ./article.md \
  --css ./themes/default.css \
  --output ./out/article.wechat.html \
  --fragment-output ./out/article.fragment.html \
  --stdout
```

## 命令行参数

```text
md-render <input.md> [options]
```

参数说明：

- `--css <path>`
  - 指定 CSS 样式文件
  - 不传时使用内嵌默认主题
- `--output <path>`
  - 指定预览 HTML 输出路径
  - 不传时默认输出到 `同名.wechat.html`
- `--fragment-output <path>`
  - 输出最终富文本 HTML 片段
- `--stdout`
  - 把最终富文本 HTML 片段打印到标准输出
- `--no-footnotes`
  - 关闭外链脚注
- `--show-mac-bar`
  - 显式开启代码块 mac bar 渲染
- `--browser <path>`
  - 指定 Chrome / Edge 可执行文件
- `--help`
  - 显示帮助

## 输出文件说明

### 1. `--output`

这是一个完整 HTML 页面，适合：

- 本地打开检查排版效果
- 点击页面内按钮复制富文本
- 交给非命令行用户直接打开使用

它不是直接粘贴到公众号后台的“原始片段”，而是一个包装好的预览容器。

### 2. `--fragment-output`

这是最终富文本片段，适合：

- 作为最终产物存档
- 后续接入剪贴板脚本
- 自己做自动化发布流程
- 与网页复制结果对比

如果你要做“脚本直接生成可粘贴结果”，这个输出最关键。

### 3. `--stdout`

与 `--fragment-output` 的内容一致，只是改为输出到标准输出。

适合：

- shell 管道
- 重定向到文件
- 外部脚本继续处理

例如：

```bash
node dist/cli.js ./article.md --stdout > ./article.fragment.html
```

## 主题与 CSS

内置主题目录：

- `themes/default.css`
- `themes/Academic-Paper.css`
- `themes/Aurora-Glass.css`
- `themes/Bauhaus.css`
- `themes/Cyberpunk-Neon.css`
- `themes/Knowledge-Base.css`
- `themes/Luxury-Gold.css`
- `themes/Morandi-Forest.css`
- `themes/Neo-Brutalism.css`
- `themes/Receipt.css`
- `themes/Sunset-Film.css`
- `themes/Template.css`

默认行为：

- 普通 CLI 和单文件 CLI 都内嵌 `default.css`
- 所以即使不传 `--css`，也能独立运行

自定义主题建议：

- 从 `themes/default.css` 复制一份改
- 保留现有结构选择器
- 尽量不要依赖外链字体或远程图片
- 如果使用 CSS 变量，最终输出阶段会尽量展开到内联样式

## Mermaid 与公式

### Mermaid

Mermaid 不会以原始 `<svg>` 形式直接留在最终 HTML 中，而是通过浏览器渲染后转成 PNG Data URL。

这样做的原因：

- 微信编辑器对复杂 SVG 支持不稳定
- PNG 更接近网页复制链路的最终可粘贴结果

### 数学公式

公式优先走 MathJax SVG 输出。

这样做的原因：

- 更贴近最终复制链路
- 对公众号场景更稳定
- 不依赖运行时脚本再二次排版

如果 MathJax 渲染失败，代码中仍保留了 KaTeX 的兜底路径。

## 开发与验证

常用命令：

```bash
npm test
npm run build
npm run build:single
```

当前测试覆盖了两类关键路径：

- 源码级渲染测试
- 单文件产物实际执行测试

单文件测试不是只检查“能否打包”，而是会真的运行：

- `npm run build:single`
- `node release/md-render.single.cjs ...`

这样可以防止出现“构建成功，但运行时仍然回头找外部依赖文件”的问题。

## 常见问题

### 1. 为什么生成了两个 HTML

因为它们用途不同：

- `preview html` 用来打开和复制
- `fragment html` 用来直接代表最终富文本片段

### 2. 为什么 Mermaid 报浏览器找不到

因为当前实现用 `puppeteer-core` 调本机浏览器做截图，不会自动下载浏览器。

解决方式：

- 安装 Chrome / Chromium / Edge
- 通过 `--browser` 指定路径
- 或设置 `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH`

### 3. 单文件版是不是完全零依赖

不是“零前置条件”，而是“零 Node 运行时依赖文件”。

含义是：

- 不需要 `node_modules`
- 不需要当前 repo 源码
- 只需要 Node.js
- 如果用到 Mermaid 或 mac bar，还需要本机浏览器

### 4. 为什么默认不直接写剪贴板

当前版本先聚焦生成与网页复制链路一致的最终 HTML。

如果后续要补：

- 直接写系统剪贴板
- 直接调用公众号自动化发布链路

可以在这个基础上继续扩展。

## 适合的使用方式

### 场景一：本地写公众号文章

```bash
node dist/cli.js ./article.md --output ./article.wechat.html
```

然后打开生成页面，点击复制，再粘贴到公众号后台。

### 场景二：要拿最终可粘贴 HTML 片段

```bash
node dist/cli.js ./article.md --fragment-output ./article.fragment.html
```

### 场景三：要分发给别人一个单文件工具

```bash
npm run build:single
node release/md-render.single.cjs ./article.md
```

把 `release/md-render.single.cjs` 发出去即可。

## 当前结论

如果你的目标是：

- 对本地 Markdown 批量渲染
- 指定主题 CSS
- 输出可直接复制到微信公众号的结果
- 同时保留一个可预览的 HTML 页面
- 还要提供一个可独立分发的单文件版本

这个目录就是对应交付物。
