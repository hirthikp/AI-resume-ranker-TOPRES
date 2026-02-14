const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle2" });
  const data = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map((b) => ({
      class: b.className,
      text: (b.textContent || "").trim().slice(0, 60),
      rect: b.getBoundingClientRect().toJSON
        ? b.getBoundingClientRect().toJSON()
        : {
            top: b.getBoundingClientRect().top,
            left: b.getBoundingClientRect().left,
            bottom: b.getBoundingClientRect().bottom,
            right: b.getBoundingClientRect().right,
            width: b.getBoundingClientRect().width,
            height: b.getBoundingClientRect().height,
          },
    }));
  });
  console.log("Found", data.length, "buttons");
  console.log(data.slice(0, 20));
  await browser.close();
})();
