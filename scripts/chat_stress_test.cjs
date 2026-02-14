// Puppeteer stress test for the Neural Assistant UI
// - Uses a dev mock: window.__MOCK_GEMINI = true to prevent external API calls
// - Sends many commands, measures response rendering time, validates UI updates

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Inject the mock flag before any script runs
  await page.evaluateOnNewDocument(() => {
    window.__MOCK_GEMINI = true;
  });

  // Helper: detect dev server on ports 3000-3010
  async function findServerUrl() {
    for (let port = 3000; port <= 3010; port++) {
      try {
        const res = await page
          .goto(`http://localhost:${port}/`, {
            waitUntil: "networkidle2",
            timeout: 1500,
          })
          .catch(() => null);
        if (res && res.ok()) return `http://localhost:${port}/`;
      } catch (e) {}
    }
    return null;
  }

  const target = await findServerUrl();
  if (!target) {
    console.error("Dev server not reachable on localhost:3000-3010");
    await browser.close();
    process.exit(1);
  }
  console.log("Found dev server at", target);

  // Ensure we are authenticated for the gateway by setting session in localStorage
  await page.evaluate(() => {
    try {
      const admin = {
        id: "admin-0",
        username: "admin",
        role: "RECRUITER",
        password: "admin123",
      };
      localStorage.setItem("topres_session", JSON.stringify(admin));
    } catch (e) {}
  });
  // Navigate directly to gateway route (HashRouter expects #/gateway)
  await page.goto(target + "#/gateway", { waitUntil: "networkidle2" });
  // allow initial animations
  await new Promise((r) => setTimeout(r, 400));
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const w = window.innerWidth,
      h = window.innerHeight;
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      const r = b.getBoundingClientRect();
      if (
        r.bottom > h - 120 &&
        r.right > w - 120 &&
        r.width >= 60 &&
        r.height >= 60
      ) {
        b.click();
        return true;
      }
    }
    return false;
  });
  if (!clicked) {
    console.error("Could not locate floating assistant button");
    await browser.close();
    process.exit(1);
  }

  // Wait for input box to appear
  const inputSel = 'input[placeholder="Inject command node..."]';
  await page.waitForSelector(inputSel, { visible: true, timeout: 5000 });

  // Example prompts to send
  const prompts = [
    "Shortlist top 3",
    "Filter for React skills with min_experience 3 and top 5",
    "Summarize candidate John Doe",
    "Generate questions for Jane Smith",
    "Generate invite email for John Doe",
    "Analytics summary",
  ];

  const iterations = 60;
  const timings = [];
  const failures = [];

  for (let i = 0; i < iterations; i++) {
    const prompt = prompts[i % prompts.length] + ` #${i}`;

    // Fill and send
    await page.click(inputSel, { clickCount: 3 });
    await page.type(inputSel, prompt, { delay: 10 });

    const sendBtn = "button:has(svg[data-icon])";
    // click the send button (the one with <Send>) - fallback to pressing Enter
    try {
      await page.keyboard.press("Enter");
    } catch (e) {
      // ignore
    }

    // Measure time until assistant response block appears
    const t0 = Date.now();
    try {
      await page.waitForFunction(
        () => {
          const items = Array.from(document.querySelectorAll("div")).filter(
            (d) =>
              d.textContent && d.textContent.includes("Command Synchronized"),
          );
          return items.length > 0;
        },
        { timeout: 5000 },
      );
      const dt = Date.now() - t0;
      timings.push(dt);
    } catch (err) {
      failures.push({ prompt, error: err.message || String(err) });
    }

    // small pause to keep UI responsive
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log("Timings (ms) sample:", timings.slice(0, 10));
  console.log(
    "Average response ms:",
    timings.length
      ? (timings.reduce((a, b) => a + b, 0) / timings.length).toFixed(1)
      : "n/a",
  );
  console.log("Failures count:", failures.length);
  if (failures.length) console.log(failures.slice(0, 5));

  await browser.close();
})();
