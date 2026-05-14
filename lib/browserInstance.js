import puppeteer from "puppeteer";

let browser = null;

export async function getBrowser() {
  if (browser) {
    return browser;
  }

  browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  return browser;
}