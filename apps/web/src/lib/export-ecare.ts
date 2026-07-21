import type { EstimateResult } from "./types";
import { formatGbp, formatPu } from "./format";

export interface EcareSlide {
  slideNumber: number;
  title: string;
  layout: string;
  content: Record<string, unknown>;
}

export interface EcareDeckExport {
  format: "ecare-deck-v1";
  exportedAt: string;
  projectName: string;
  flow: string;
  year: number;
  pur: number;
  slides: EcareSlide[];
}

export function buildEcareDeck(result: EstimateResult): EcareDeckExport {
  const { headline, confidence, lineItems, gaps } = result;

  return {
    format: "ecare-deck-v1",
    exportedAt: new Date().toISOString(),
    projectName: result.projectName,
    flow: result.flow === "iia" ? "IIA / Seed Funding" : "IA (post-HLD)",
    year: result.year,
    pur: result.pur,
    slides: [
      {
        slideNumber: 1,
        title: "Executive Summary",
        layout: "title-and-bullets",
        content: {
          headline: result.projectName,
          bullets: [
            `Total effort: ${formatPu(headline.pu)} PU (${formatGbp(headline.costGbp)})`,
            `Duration: ${headline.duration}`,
            `Confidence band: ${headline.band}`,
            `Planning year: ${result.year} @ £${result.pur}/PU`,
          ],
        },
      },
      {
        slideNumber: 2,
        title: "Estimate Headline",
        layout: "metrics-grid",
        content: {
          metrics: [
            { label: "Person Units (PU)", value: formatPu(headline.pu) },
            { label: "Cost (£)", value: formatGbp(headline.costGbp) },
            { label: "Duration", value: headline.duration },
            { label: "Band", value: headline.band },
          ],
        },
      },
      {
        slideNumber: 3,
        title: "Confidence Band",
        layout: "range-chart",
        content: {
          coverage: `${Math.round(confidence.coverage * 100)}% manifest coverage`,
          puRange: `${formatPu(confidence.lowPu)} – ${formatPu(confidence.highPu)} PU`,
          costRange: `${formatGbp(confidence.lowGbp)} – ${formatGbp(confidence.highGbp)}`,
        },
      },
      {
        slideNumber: 4,
        title: "Line-Item Build-up",
        layout: "table",
        content: {
          rows: flattenLineItems(lineItems).map((item) => ({
            id: item.id,
            label: item.label,
            pu: formatPu(item.pu),
            costGbp: formatGbp(item.costGbp),
            ruleId: item.provenance.ruleId,
            evidenceSpan: item.provenance.evidenceSpan,
          })),
        },
      },
      {
        slideNumber: 5,
        title: "Gap Report",
        layout: "gap-list",
        content: {
          openGaps: gaps.length,
          items: gaps.map((g) => ({
            id: g.id,
            label: g.label,
            impact: g.impact,
            description: g.description,
          })),
        },
      },
      {
        slideNumber: 6,
        title: "Provenance Appendix",
        layout: "provenance-table",
        content: {
          note: "Every figure traceable to rule id + evidence span (Rule 1: engine-computed only).",
          entries: flattenLineItems(lineItems).map((item) => ({
            figure: formatPu(item.pu),
            ruleId: item.provenance.ruleId,
            evidenceSpan: item.provenance.evidenceSpan,
          })),
        },
      },
    ],
  };
}

function flattenLineItems(
  items: EstimateResult["lineItems"],
  depth = 0,
): Array<EstimateResult["lineItems"][number] & { depth: number }> {
  const out: Array<EstimateResult["lineItems"][number] & { depth: number }> = [];
  for (const item of items) {
    out.push({ ...item, depth });
    if (item.children) {
      out.push(...flattenLineItems(item.children, depth + 1));
    }
  }
  return out;
}

export function downloadEcareDeck(result: EstimateResult): void {
  const deck = buildEcareDeck(result);
  const blob = new Blob([JSON.stringify(deck, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFilename(result.projectName)}-ecare-deck.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "estimate";
}
