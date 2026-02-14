// Puppeteer-based stress test for the Login/Registration UI (CommonJS variant)
// Usage:
// 1. npm install puppeteer --save-dev
// 2. Start the dev server: npm run dev
// 3. node scripts/login_stress_test.cjs

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle2" });

  async function setInput(selector, value) {
    await page.waitForSelector(selector, { visible: true, timeout: 2000 });
    await page.click(selector, { clickCount: 3 });
    await page.type(selector, value, { delay: 20 });
  }

  const iterations = 20;
  const delays = { betweenRegs: 200 };
  const results = {
    registered: 0,
    duplicate: 0,
    loginSuccess: 0,
    loginFail: 0,
  };
  // Wait for the dev server to be reachable before doing actions
  async function waitForServer(url, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const resp = await page
          .goto(url, { waitUntil: "networkidle2", timeout: 2000 })
          .catch(() => null);
        if (resp && resp.ok()) return true;
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }

  // Try to discover which localhost port Vite is using (3000-3010)
  async function findServerUrl() {
    for (let port = 3000; port <= 3010; port++) {
      const url = `http://localhost:${port}/`;
      const ok = await waitForServer(url, 1500).catch(() => false);
      if (ok) return url;
    }
    return null;
  }

  const targetUrl = await findServerUrl();
  if (!targetUrl) {
    console.error("Dev server not reachable on localhost:3000-3010");
    await browser.close();
    process.exit(1);
  }
  console.log("Found dev server at", targetUrl);

  console.log("Starting stress test:", iterations, "registrations");

  for (let i = 0; i < iterations; i++) {
    const uname = `stress_user_${Date.now()}_${i}`;
    const pwd = "testpass";

    await setInput('input[placeholder="E.g. admin"]', uname);
    await setInput("input[type=password]", pwd);

    // Click register
    const regXPath =
      "//p[contains(normalize-space(.), 'Register New Neural Node')]";
    const [regEl] = await page.$x(regXPath);
    if (regEl) await regEl.click();

    // Wait for either localStorage update (successful registration) or error banner
    const start = Date.now();
    let registered = false;
    let duplicate = false;
    while (Date.now() - start < 3000) {
      const users = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem("topres_users") || "[]");
        } catch (e) {
          return [];
        }
      });
      if (users.find((u) => u.username === uname)) {
        registered = true;
        break;
      }
      const err = await page.$("div.bg-rose-50");
      if (err) {
        duplicate = true;
        break;
      }
      await page.waitForTimeout(150);
    }
    if (registered) results.registered += 1;
    else if (duplicate) results.duplicate += 1;
    else results.duplicate += 1; // timeout treated as duplicate/failure
  }

  console.log("Registration phase complete:", results);

  const testUser = await page.evaluate(() => {
    const data = localStorage.getItem("topres_users");
    if (!data) return null;
    const users = JSON.parse(data);
    return users[users.length - 1]?.username || null;
  });

  if (testUser) {
    await page.goto(targetUrl, { waitUntil: "networkidle2" });
    await setInput('input[placeholder="E.g. admin"]', testUser);
    await setInput("input[type=password]", "testpass");

    const [btn] = await page.$x(
      "//button[contains(., 'Synchronize Identity')]",
    );
    if (btn) {
      const t0 = Date.now();
      await btn.click();
      let navigated = false;
      const navStart = Date.now();
      while (Date.now() - navStart < 5000) {
        const url = page.url();
        if (url.includes("/gateway") || url.includes("/lab")) {
          navigated = true;
          break;
        }
        await page.waitForTimeout(150);
      }
      const timeMs = Date.now() - t0;
      console.log(
        "Login navigation time (ms):",
        timeMs,
        "navigated:",
        navigated,
      );
      if (navigated) results.loginSuccess += 1;
      else results.loginFail += 1;
    } else {
      console.warn("Login button not found");
      results.loginFail += 1;
    }
  }

  console.log("Final results:", results);

  await browser.close();
})();
