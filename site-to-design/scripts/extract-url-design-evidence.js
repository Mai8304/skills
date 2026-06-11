#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

function parseArgs(argv) {
  const options = {
    out: ".design-md-evidence",
    channel: "chrome",
    waitMs: 7000,
    screenshots: true,
    viewports: "desktop,mobile",
    locale: "en-US",
  };
  const urls = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") options.out = argv[++i];
    else if (arg.startsWith("--out=")) options.out = arg.slice("--out=".length);
    else if (arg === "--channel") options.channel = argv[++i];
    else if (arg.startsWith("--channel=")) options.channel = arg.slice("--channel=".length);
    else if (arg === "--wait-ms") options.waitMs = Number(argv[++i]);
    else if (arg.startsWith("--wait-ms=")) options.waitMs = Number(arg.slice("--wait-ms=".length));
    else if (arg === "--viewports") options.viewports = argv[++i];
    else if (arg.startsWith("--viewports=")) options.viewports = arg.slice("--viewports=".length);
    else if (arg === "--locale") options.locale = argv[++i];
    else if (arg.startsWith("--locale=")) options.locale = arg.slice("--locale=".length);
    else if (arg === "--no-screenshots") options.screenshots = false;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      urls.push(arg);
    }
  }

  if (!urls.length) throw new Error("Provide at least one URL.");
  if (!Number.isFinite(options.waitMs) || options.waitMs < 0) {
    throw new Error("--wait-ms must be a non-negative number.");
  }

  return { options, urls };
}

function printHelp() {
  console.log(`Usage:
  node extract-url-design-evidence.js [options] <url...>

Options:
  --out <dir>             Output directory (default: .design-md-evidence)
  --channel <name>        Chromium channel, prefer chrome (default: chrome)
  --viewports <list>      desktop,mobile or custom names (default: desktop,mobile)
  --locale <locale>       Browser locale (default: en-US)
  --wait-ms <ms>          Wait after DOMContentLoaded (default: 7000)
  --no-screenshots        Do not save screenshots
`);
}

function loadPlaywright() {
  const candidates = [
    () => require("playwright"),
    () => require("@playwright/test"),
    () => createRequire(path.join(process.cwd(), "package.json"))("@playwright/test"),
    () => createRequire(path.join(process.cwd(), "package.json"))("playwright"),
  ];

  for (const candidate of candidates) {
    try {
      const mod = candidate();
      if (mod.chromium) return mod;
    } catch (_) {
      // Try the next resolution path.
    }
  }

  throw new Error(
    "Playwright is not available. Run `npm install --save-dev @playwright/test --ignore-scripts` in the working directory, then retry.",
  );
}

function viewportConfig(names) {
  const known = {
    desktop: { id: "desktop", width: 1440, height: 1200 },
    mobile: { id: "mobile", width: 390, height: 844 },
    tablet: { id: "tablet", width: 768, height: 1024 },
  };

  return names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      if (known[name]) return known[name];
      const match = name.match(/^([a-z0-9_-]+):(\d+)x(\d+)$/i);
      if (!match) throw new Error(`Unknown viewport '${name}'. Use desktop,mobile,tablet or name:WIDTHxHEIGHT.`);
      return { id: match[1], width: Number(match[2]), height: Number(match[3]) };
    });
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "page";
}

async function scrollForLazyContent(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const max = Math.min(document.body.scrollHeight, 9000);
    for (let y = 0; y <= max; y += 900) {
      window.scrollTo(0, y);
      await delay(200);
    }
    window.scrollTo(0, 0);
  });
}

async function extractPage(page, target, viewport, screenshotPath) {
  return page.evaluate(
    ({ target, viewport, screenshotPath }) => {
      function isVisible(el) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      }

      function rgbToHex(value) {
        const match = value.match(/^rgba?\(([^)]+)\)$/);
        if (!match) return value;
        const parts = match[1].split(",").map((part) => part.trim());
        const [r, g, b] = parts.slice(0, 3).map((part) => Number.parseFloat(part));
        const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
        if ([r, g, b].some((n) => Number.isNaN(n))) return value;
        const hex = [r, g, b]
          .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
          .join("");
        return alpha === 1 ? `#${hex}` : `#${hex}@${alpha}`;
      }

      function addCount(map, key, example) {
        if (!key || key === "transparent" || key === "rgba(0, 0, 0, 0)") return;
        const normalized = key.startsWith("rgb") ? rgbToHex(key) : key;
        map[normalized] ||= { count: 0, examples: [] };
        map[normalized].count += 1;
        if (example && map[normalized].examples.length < 4) map[normalized].examples.push(example);
      }

      function textOf(el) {
        return (el.innerText || el.getAttribute("aria-label") || el.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);
      }

      function rectOf(el) {
        const rect = el.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }

      function styleOf(el) {
        const s = window.getComputedStyle(el);
        return {
          color: rgbToHex(s.color),
          backgroundColor: rgbToHex(s.backgroundColor),
          borderColor: rgbToHex(s.borderTopColor),
          borderRadius: s.borderRadius,
          boxShadow: s.boxShadow,
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
          margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
          display: s.display,
        };
      }

      const all = Array.from(document.querySelectorAll("body *")).filter(isVisible);
      const colorCounts = {};
      const fontCounts = {};
      const radiusCounts = {};
      const shadowCounts = {};
      const spacingCounts = {};

      for (const el of all) {
        const s = window.getComputedStyle(el);
        const label = `${el.tagName.toLowerCase()} ${textOf(el)}`.slice(0, 140);
        ["color", "backgroundColor", "borderTopColor", "borderBottomColor", "fill", "stroke"].forEach((prop) =>
          addCount(colorCounts, s[prop], label),
        );
        addCount(fontCounts, `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.lineHeight}|${s.letterSpacing}`, label);
        addCount(radiusCounts, s.borderRadius, label);
        addCount(shadowCounts, s.boxShadow, label);
        [
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "marginTop",
          "marginRight",
          "marginBottom",
          "marginLeft",
          "gap",
          "columnGap",
          "rowGap",
        ].forEach((prop) => addCount(spacingCounts, s[prop], label));
      }

      const root = window.getComputedStyle(document.documentElement);
      const cssVariables = {};
      for (let i = 0; i < root.length; i += 1) {
        const name = root[i];
        if (name.startsWith("--")) cssVariables[name] = root.getPropertyValue(name).trim();
      }

      const pick = (selector, limit) =>
        Array.from(document.querySelectorAll(selector))
          .filter(isVisible)
          .slice(0, limit)
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            text: textOf(el),
            ariaLabel: el.getAttribute("aria-label"),
            role: el.getAttribute("role"),
            rect: rectOf(el),
            style: styleOf(el),
          }));

      const cards = Array.from(document.querySelectorAll("article, section, li, div"))
        .filter(isVisible)
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width >= 140 && rect.height >= 100 && (el.querySelector("img") || el.querySelector("picture")) && textOf(el).length > 8;
        })
        .slice(0, 40)
        .map((el) => ({
          text: textOf(el),
          rect: rectOf(el),
          style: styleOf(el),
          imageCount: el.querySelectorAll("img,picture").length,
          buttonCount: el.querySelectorAll("button,[role='button']").length,
          linkCount: el.querySelectorAll("a[href]").length,
        }));

      const top = (map, count) => Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, count);

      return {
        id: target.id,
        url: target.url,
        viewport,
        title: document.title,
        screenshotPath,
        metrics: {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          elementCount: all.length,
        },
        bodyTextStart: textOf(document.body).slice(0, 1500),
        cssVariables,
        topColors: top(colorCounts, 50),
        topFonts: top(fontCounts, 40),
        topRadii: top(radiusCounts, 30),
        topShadows: top(shadowCounts, 25),
        topSpacing: top(spacingCounts, 50),
        headings: pick("h1,h2,h3,[role='heading']", 40),
        buttons: pick("button,[role='button'],input[type='submit']", 60),
        links: pick("a[href]", 60),
        inputs: pick("input,textarea,select,[contenteditable='true']", 40),
        navigation: pick("header,nav,[role='navigation']", 20),
        footer: pick("footer", 10),
        cards,
      };
    },
    { target, viewport, screenshotPath },
  );
}

(async () => {
  const { options, urls } = parseArgs(process.argv.slice(2));
  const { chromium } = loadPlaywright();
  const outDir = path.resolve(options.out);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: options.channel, headless: true });
  const results = [];
  const viewports = viewportConfig(options.viewports);

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: options.locale,
      colorScheme: "light",
    });

    for (let index = 0; index < urls.length; index += 1) {
      const target = { id: `page-${index + 1}`, url: urls[index] };
      const page = await context.newPage();
      page.setDefaultTimeout(45000);
      console.error(`Analyzing ${target.url} (${viewport.id})`);
      await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForTimeout(options.waitMs);
      await scrollForLazyContent(page);
      await page.waitForTimeout(1000);

      let screenshotPath = null;
      if (options.screenshots) {
        screenshotPath = path.join(outDir, `${safeName(target.id)}-${safeName(viewport.id)}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      results.push(await extractPage(page, target, viewport, screenshotPath));
      await page.close();
    }

    await context.close();
  }

  await browser.close();

  const outputPath = path.join(outDir, "evidence.json");
  fs.writeFileSync(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), urls, viewports, results }, null, 2));
  console.log(outputPath);
})().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
