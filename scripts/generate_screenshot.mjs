// @ts-check
// Script to generate a mobile screenshot of the app
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const folder = path.join(__dirname, "..", "public", "images");

  // Ensure the directory exists
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const browser = await prepareBrowser();
  const page = await loadPage(browser, "http://localhost:3000");

  try {
    await startScreenshot(page, path.join(folder, "screenshot_start.png"));
    await focusScreenshot(page, path.join(folder, "screenshot_focus.png"));
  } catch (error) {
    console.error("Error capturing screenshots:", error);
  } finally {
    await browser.close();
  }
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Prepare the browser for the screenshot
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function prepareBrowser() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browser;
}

/**
 * Load a page in the browser
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<import('puppeteer').Page>}
 */
async function loadPage(browser, url) {
  console.log("Opening page...");
  const page = await browser.newPage();

  // Set the viewport to mobile dimensions
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await sleep(2000);

  return page;
}

/**
 * Take a screenshot of the initial page
 * @param {import('puppeteer').Page} page
 * @param {string} path
 */
async function startScreenshot(page, path) {
  await page.screenshot({
    path,
    fullPage: false,
  });
  console.log(`Saved screenshot to: ${path}`);
}

/**
 * Take a screenshot of the focused page
 * @param {import('puppeteer').Page} page
 * @param {string} path
 */
async function focusScreenshot(page, path) {
  const element = await page.waitForSelector("g#Zones path:first-child", {
    timeout: 10000,
    visible: true,
  });
  if (!element) {
    console.error("Element with selector 'g#Zones path:first-child' not found");
    return;
  }

  await element.click();
  await sleep(2000);
  await page.screenshot({
    path,
    fullPage: false,
  });
  console.log(`Saved screenshot to: ${path}`);
}

main();
