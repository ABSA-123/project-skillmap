// Take screenshots of the running SkillMap app using Chrome via puppeteer-core
const path = require("path");
const fs = require("fs");

const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3001";
const OUT = path.resolve(__dirname, "..", "docs", "screenshots");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };

async function snap(page, file, opts = {}) {
  const target = path.join(OUT, file);
  await page.screenshot({
    path: target,
    fullPage: !!opts.fullPage,
  });
  console.log("  saved", file);
}

async function go(page, url) {
  console.log("→", url);
  await page.goto(BASE + url, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: VIEWPORT,
  });

  const page = await browser.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log("  [browser]", m.text());
  });
  page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

  try {
    // ----- 1. Login -----
    await go(page, "/login");
    await snap(page, "01-login.png");

    // ----- 2. Signup -----
    await go(page, "/signup");
    await snap(page, "02-signup.png");

    // ----- Create account via UI so localStorage gets the session -----
    console.log("→ Creating demo account…");
    const email = `demo+${Date.now()}@skillmap.local`;
    const password = "Password123!";
    await page.type("#name", "Demo User");
    await page.type("#email", email);
    await page.type("#password", password);
    await page.type("#confirm", password);
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 3000));
    console.log("  current URL:", page.url());

    // Verify session exists in localStorage
    const session = await page.evaluate(() =>
      window.localStorage.getItem("skillmap:session")
    );
    console.log("  session:", session ? "OK" : "MISSING");

    // If we are not on dashboard, force a navigation
    if (!page.url().includes("/dashboard")) {
      await go(page, "/dashboard");
    }

    // ----- 3. Dashboard -----
    await snap(page, "03-dashboard.png");

    // ----- 4. Roadmaps list -----
    await go(page, "/roadmaps");
    await snap(page, "04-roadmaps.png");

    // ----- 5. New roadmap -----
    await go(page, "/roadmaps/new");
    await snap(page, "05-roadmap-new.png");

    // ----- 6. Community -----
    await go(page, "/community");
    await snap(page, "06-community.png");

    // ----- 7. Challenges -----
    await go(page, "/challenges");
    await snap(page, "07-challenges.png");

    // ----- 8. Profile -----
    await go(page, "/profile");
    await snap(page, "08-profile.png");
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
