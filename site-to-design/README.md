# Site to DESIGN.md

从一个或多个公开网站 URL 生成 Google `DESIGN.md`。它不是直接让模型凭 URL 猜测设计系统，而是先用浏览器采集真实页面证据，再把颜色、字体、间距、圆角、阴影和组件模式提炼成可校验的 `DESIGN.md`。

默认浏览器为本机 Chrome：

```js
channel: "chrome"
```

![Site to DESIGN.md 工作流](./assets/workflow.svg)

## 如何使用

### 1. 安装

从 GitHub 安装这个目录：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/Mai8304/skills/tree/main/site-to-design
```

安装后重启你的 agent 环境，让新能力被自动发现。

### 2. 生成 DESIGN.md

给一个网站 URL：

```text
Use $site-to-design to generate a Google DESIGN.md from https://example.com
```

如果想让设计系统更完整，建议提供多个代表页面：

```text
Use $site-to-design to generate DESIGN.md from:
- https://example.com/
- https://example.com/pricing
- https://example.com/product
```

适合选择的页面包括：首页、产品页、定价页、登录页、列表页、详情页、表单页和品牌内容页。

### 3. 可选：直接采集浏览器证据

如果你只想先采集原始证据，可以直接运行脚本：

```bash
npm install --save-dev @playwright/test --ignore-scripts

node ~/.codex/skills/site-to-design/scripts/extract-url-design-evidence.js \
  --out .design-md-evidence \
  https://example.com
```

输出目录会包含 `evidence.json` 和截图。默认使用 Chrome；只有在你明确需要其他 Chromium 渠道时，才需要覆盖 `--channel`：

```bash
node ~/.codex/skills/site-to-design/scripts/extract-url-design-evidence.js \
  --channel chrome-beta \
  https://example.com
```

## 默认输出

默认只交付一个 `DESIGN.md` 文件，里面包含：

- YAML front matter：机器可读的 design tokens。
- Markdown 正文：设计风格、使用规则和设计理由。
- 颜色、字体、间距、圆角和组件 tokens。
- 对 confirmed browser evidence 和 inferred design interpretation 的区分。

截图、HTML 快照、`evidence.json` 属于中间证据。除非需要审查或调试，一般不作为最终交付物展示。

## 校验方式

每个生成的 `DESIGN.md` 都应该通过官方工具校验：

```bash
npx @google/design.md lint DESIGN.md --format=json
npx @google/design.md export --format tailwind DESIGN.md >/tmp/design-md-tailwind.json
npx @google/design.md export --format dtcg DESIGN.md >/tmp/design-md-dtcg.json
```

如果真实品牌色触发 contrast warning，不要为了消除 warning 擅自改颜色。提取模式下应该保留真实值，并把 warning 作为可访问性风险记录。

## 工作流会提取什么

- CSS variables 和页面里的 token 线索。
- computed styles 中的颜色、字体、间距、圆角和阴影。
- 桌面端和移动端响应式状态。
- 导航、按钮、卡片、表单、徽章、媒体网格、footer、modal 等组件候选。
- 可以提升为 `DESIGN.md` tokens 的重复模式。

## 对比说明

![证据优先流程对比](./assets/comparison.svg)

直接把 URL 交给模型也能生成一份看似合理的设计总结，但它容易把真实页面观察、已有记忆和推断混在一起。Site to DESIGN.md 的流程更慢，因为它先采集浏览器证据；但结果更容易复核、校验、导出和长期维护。

## English note

This README is Chinese-first by default. The workflow still produces standard Google `DESIGN.md` files and keeps command names, package names, and token terminology in English where that is the expected interface.
