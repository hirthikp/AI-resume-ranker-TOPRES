// Puppeteer-based stress test for the Login/Registration UI
// Usage:
// 1. npm install puppeteer --save-dev
// 2. Start the dev server: npm run dev
// 3. node scripts/login_stress_test.js

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle2" });

  // Helper to set input values
  async function setInput(selector, value) {
    await page.evaluate((sel) => {
      document.querySelector(sel).value = "";
    }, selector);
    await page.click(selector);
    await page.type(selector, value, { delay: 20 });
  }

  // Stress parameters
  const iterations = 50;
  const delays = { betweenRegs: 50 };
  const results = {
    registered: 0,
    duplicate: 0,
    loginSuccess: 0,
    loginFail: 0,
  };

  console.log("Starting stress test:", iterations, "registrations");

  for (let i = 0; i < iterations; i++) {
    const uname = `stress_user_${Date.now()}_${i}`;
    const pwd = "testpass";

    // Fill username
    await setInput('input[placeholder="E.g. admin"]', uname);
    // Fill password (password inputs are second input on the form)
    await setInput("input[type=password]", pwd);

    // Click register text (it's a <p> element in the UI)
    await page
      .click('p:text("Register New Neural Node")', { delay: 10 })
      .catch(async () => {
        // fallback: click by matching text using XPath
        const [el] = await page.$x(
          "//p[contains(., 'Register New Neural Node')]",
        );
        if (el) await el.click();
      });

    // Wait a short time and check for errors
    await page.waitForTimeout(delays.betweenRegs);

    // Check whether an error banner appeared
    const error = await page.$("div:has(div.bg-rose-50)");
    if (error) {
      results.duplicate += 1;
    } else {
      results.registered += 1;
    }
  }

  console.log("Registration phase complete:", results);

  // Now test login with one of the created users
  // Use the last registered username if any
  const testUser =
    results.registered > 0
      ? await page.evaluate(() => {
          // read last created user from localStorage
          const data = localStorage.getItem("topres_users");
          if (!data) return null;
          const users = JSON.parse(data);
          return users[users.length - 1]?.username || null;
        })
      : null;

  if (testUser) {
    // Reload the page to reset UI
    await page.goto("http://localhost:3001/", { waitUntil: "networkidle2" });
    await setInput('input[placeholder="E.g. admin"]', testUser);
    await setInput("input[type=password]", "testpass");
    // Click Login button
    // The Button is the large Synchronize Identity button
    await page
      .click('button:has-text("Synchronize Identity")')
      .catch(async () => {
        const [btn] = await page.$x(
          "//button[contains(., 'Synchronize Identity')]",
        );
        if (btn) await btn.click();
      });

    await page.waitForTimeout(600);
    // Check navigation by reading location
    const url = page.url();
    if (url.includes("/gateway") || url.includes("/lab"))
      results.loginSuccess += 1;
    else results.loginFail += 1;
  }

  console.log("Final results:", results);

  await browser.close();
})();
