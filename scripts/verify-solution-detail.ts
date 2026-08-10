// One-off verification (deleted after use): Solution section detail.
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const problems: string[] = [];
  page.on("console", (msg) => {
    // Ignore the known Unsplash hotlink artifact in headless (no Referer → ORB).
    if (msg.type() === "error" && !msg.text().includes("images.unsplash.com")) {
      problems.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => problems.push(`[pageerror] ${err.message}`));

  await page.goto("http://localhost:3001", { waitUntil: "load", timeout: 90_000 });
  await page.waitForTimeout(3_000);

  const report: Record<string, unknown> = {};

  const section = page.locator("section.bg-\\[\\#F8FAFC\\]").first();
  report.sectionBg = await section
    .evaluate((el) => getComputedStyle(el as HTMLElement).backgroundColor)
    .catch(() => "(no section)");
  report.sectionPaddingY = await section
    .evaluate((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return `${s.paddingTop} / ${s.paddingBottom}`;
    })
    .catch(() => "");

  // Desktop 40/60 split.
  const grid = section.locator(".grid").first();
  report.gridColumns = await grid
    .evaluate((el) => getComputedStyle(el as HTMLElement).gridTemplateColumns)
    .catch(() => "");

  // Pillar badges 01-04.
  report.pillarBadges = await Promise.all(
    ["01", "02", "03", "04"].map((n) =>
      page.getByText(n, { exact: true }).first().isVisible().catch(() => false),
    ),
  );
  // First pillar badge styling (blue circle).
  report.pillarBadgeStyle = await page
    .locator("text=/^0[1-4]$/")
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el.parentElement as HTMLElement);
      return `${s.backgroundColor} / ${s.borderRadius}`;
    })
    .catch(() => "");

  // Image card + overlay badge.
  report.imageExists = (await page.locator('img[src*="unsplash.com"]').count()) > 0;
  report.overlayText = await page
    .getByText("Real-time coordination across every response agency")
    .isVisible()
    .catch(() => false);
  report.overlayBlur = await page
    .getByText("Real-time coordination across every response agency")
    .evaluate((el) => getComputedStyle(el.closest(".backdrop-blur-\\[10px\\]") as HTMLElement).backdropFilter)
    .catch(() => "");
  report.pulsingDot = await page
    .locator("section.bg-\\[\\#F8FAFC\\] .animate-pulse")
    .count()
    .catch(() => 0);

  console.log("--- ERRORS (unsplash hotlink excluded) ---");
  console.log(problems.length ? problems.join("\n") : "NONE");
  console.log("--- SOLUTION DETAIL CHECK ---");
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
  process.exit(problems.length ? 1 : 0);
}

void main();
