#!/usr/bin/env node
// Render tools/og/og.html into og.png (1200×630), the picture shown when the site link is shared.
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(resolve("tools/og/og.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "og.png" });
await browser.close();
console.log("✓ og.png");
