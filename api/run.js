import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  let browser = null;

  try {
    const executablePath = await chromium.executablePath;

    if (!executablePath) {
      throw new Error("Chromium executablePath not found.");
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://marketplace.roninchain.com/collections/forgotten-runiverse-items?search=flaming%20barrage&auction=Sale", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector(".AttributeItem_statsAttributeName__6bcNi", { timeout: 15000 });

    const data = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("div.MarketItem_card__GGBpS"));
      return cards.map(card => {
        const name = card.querySelector("h6")?.innerText || "";
        const price = card.querySelector("h3")?.innerText || "";
        const stats = {};
        const rows = card.querySelectorAll(".AttributeItem_statsAttributeNameText__fW1GS");
        rows.forEach((row) => {
          const label = row?.innerText;
          const value = row?.parentElement?.nextElementSibling?.innerText?.split("/")?.[0];
          if (label && value) stats[label] = value;
        });
        return { name, price, ...stats };
      });
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Fehler beim Abruf:", error);
    res.status(500).json({ error: "Fehler beim Abruf", details: error.message });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
