const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
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

    await browser.close();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Fehler beim Abruf:", error);
    res.status(500).json({ error: "Fehler beim Abruf", details: error.message });
  }
}
