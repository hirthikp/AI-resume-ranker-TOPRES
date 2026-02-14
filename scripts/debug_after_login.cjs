const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle2" });
  // login
  try {
    await page.waitForSelector('input[placeholder="E.g. admin"]', {
      timeout: 2000,
    });
    await page.click('input[placeholder="E.g. admin"]', { clickCount: 3 });
    await page.type('input[placeholder="E.g. admin"]', "admin", { delay: 20 });
    await page.click("input[type=password]", { clickCount: 3 });
    await page.type("input[type=password]", "admin123", { delay: 20 });
    const [loginBtn] = await page.$x(
      "//button[contains(., 'Synchronize Identity')]",
    );
    if (loginBtn) await loginBtn.click();
  } catch (e) {
    // ignore
  }
  // wait a bit
  await new Promise((r) => setTimeout(r, 800));
  console.log("URL after login:", page.url());
  const data = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map((b) => ({
      class: b.className,
      text: (b.textContent || "").trim().slice(0, 60),
      rect: b.getBoundingClientRect(),
    }));
  });
  console.log("Found", data.length, "buttons after login");
  console.log(data.slice(0, 30));
  await browser.close();
})();
