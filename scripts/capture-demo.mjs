import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:5173/";
const demoDir = path.resolve("demo");
const screenshotDir = path.join(demoDir, "screenshots");
const videoDir = path.join(demoDir, "videos");

await mkdir(screenshotDir, { recursive: true });
await mkdir(videoDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function captureViewport(name, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true });
  const metrics = await page.evaluate(() => {
    const process = document.querySelector("#workflows");
    return {
      bodyWidth: document.body.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      h1: document.querySelector("h1")?.textContent,
      nextSectionVisible: process ? process.getBoundingClientRect().top < innerHeight : false,
      overflowX: document.body.scrollWidth > document.documentElement.clientWidth,
      title: document.title,
      viewport: { height: innerHeight, width: innerWidth }
    };
  });
  await page.close();
  return metrics;
}

const desktop = await captureViewport("desktop-fullpage", { width: 1440, height: 900 });
const mobile = await captureViewport("mobile-fullpage", { width: 390, height: 844 });

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: videoDir,
    size: { width: 1280, height: 720 }
  }
});

const page = await context.newPage();
await page.goto(baseUrl, { waitUntil: "load" });
const primaryNav = page.getByLabel("Primary navigation");
await page.getByRole("button", { name: "Generate an audit" }).click();
await page.locator(".stack-card").getByText("Scoped add-on").click();
await primaryNav.getByRole("link", { name: "Delivery Model" }).click();
await page.waitForTimeout(500);
await page.locator(".stack-table .stack-row", { hasText: "Remote private workspace" }).click();
await primaryNav.getByRole("link", { name: "Demo" }).click();
await page.waitForTimeout(500);
await page.getByLabel("Approve").uncheck();
await page.waitForTimeout(350);
await page.getByLabel("Approve").check();
await primaryNav.getByRole("link", { name: "Pricing" }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /AI Workflow Audit/ }).click();
await page.waitForTimeout(350);
await page.getByRole("button", { name: /Ship Sprint/ }).click();
await page.getByRole("link", { name: "Book audit" }).click();
await page.getByLabel("Name").fill("Demo Owner");
await page.getByLabel("Work email").fill("demo@example.com");
await page.getByLabel("Company").fill("ACME Family Clinic");
await page.getByLabel("Phone").fill("(555) 010-2026");
await page.getByLabel("Industry").selectOption("Clinic or healthcare admin");
await page.getByLabel("Team size").selectOption("6-15");
await page.getByLabel("Budget range").selectOption("$9,500 sprint ready");
await page.getByLabel("Workflow to fix first").fill("Turn intake PDFs into a reviewed patient summary and task list.");
await page.getByLabel("Privacy or deployment needs").fill("Sensitive data. Start remote-first, then install locally if hardware is ready.");
await page.getByLabel("Best times for a 30-minute call").fill("Tuesday after 2pm PT");
await page.waitForTimeout(700);

const video = page.video();
await page.close();
await context.close();

let videoPath = null;
if (video) {
  videoPath = await video.path();
  const finalVideo = path.join(videoDir, "shipaxiom-demo.webm");
  await rename(videoPath, finalVideo);
  videoPath = finalVideo;
}

await browser.close();

const result = {
  baseUrl,
  desktop,
  mobile,
  screenshots: {
    desktop: path.join(screenshotDir, "desktop-fullpage.png"),
    mobile: path.join(screenshotDir, "mobile-fullpage.png")
  },
  video: videoPath
};

await writeFile(path.join(demoDir, "qa-results.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
