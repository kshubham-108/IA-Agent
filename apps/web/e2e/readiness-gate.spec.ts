import { expect, test } from "@playwright/test";
import path from "node:path";

test.describe("Readiness Gate", () => {
  test("grey → amber → green → submit enabled", async ({ page }) => {
    await page.goto("/");

    const requirements = page.getByTestId("checklist-requirements");
    const submit = page.getByTestId("submit-button");
    const confidenceChip = page.getByTestId("confidence-chip");

    await expect(requirements).toHaveAttribute("data-status", "pending");
    await expect(submit).toHaveAttribute("data-enabled", "false");
    await expect(submit).toHaveCSS("opacity", "0.25");
    await expect(confidenceChip).toHaveText("−50% / +100%");

    const partialVision = path.join(
      __dirname,
      "fixtures",
      "partial_vision_card.docx",
    );
    await page.getByTestId("upload-button").click();
    await page.locator('input[type="file"]').setInputFiles(partialVision);

    await expect(requirements).toHaveAttribute("data-status", "partial", {
      timeout: 10_000,
    });
    await expect(requirements.locator(".checklist-reason")).toContainText(
      "SMART",
    );
    await expect(submit).toHaveAttribute("data-enabled", "false");
    await expect(submit).toHaveCSS("opacity", "0.25");

    const visionCard = path.join(__dirname, "fixtures", "OFR_Vision_Card.docx");
    await page.locator('input[type="file"]').setInputFiles(visionCard);

    await expect(requirements).toHaveAttribute("data-status", "satisfied", {
      timeout: 10_000,
    });
    await expect(submit).toHaveAttribute("data-enabled", "true");
    await expect(submit).toHaveCSS("opacity", "1");
    await expect(confidenceChip).toHaveText("−50% / +100%");

    const liveRegion = page.getByTestId("aria-live-region");
    await expect(liveRegion).toContainText("Requirements");
    await expect(liveRegion).toContainText("satisfied");
  });

  test("heatmap enriches confidence band", async ({ page }) => {
    await page.goto("/");

    const visionCard = path.join(__dirname, "fixtures", "OFR_Vision_Card.docx");
    const heatmap = path.join(__dirname, "fixtures", "Solution_Heatmap.xlsx");

    await page.locator('input[type="file"]').setInputFiles([visionCard, heatmap]);

    await expect(page.getByTestId("checklist-requirements")).toHaveAttribute(
      "data-status",
      "satisfied",
      { timeout: 10_000 },
    );
    await expect(page.getByTestId("checklist-impact_areas")).toHaveAttribute(
      "data-status",
      "satisfied",
      { timeout: 10_000 },
    );
    await expect(page.getByTestId("confidence-chip")).toHaveText("−30% / +50%");
  });
});
