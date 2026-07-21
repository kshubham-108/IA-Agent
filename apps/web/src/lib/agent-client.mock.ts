import type { AgentClient } from "./agent-client";
import type {
  ConfidenceBand,
  EstimateRequest,
  EstimateResult,
  FlowType,
  GapField,
  LineItem,
} from "./types";
import { getPurForYear } from "./rates";

function sessionId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyPur(pu: number, year: number): number {
  return Math.round(pu * getPurForYear(year) * 100) / 100;
}

function iiaConfidence(pu: number, year: number, coverage: number): ConfidenceBand {
  const lowPu = Math.round(pu * 0.7 * 100) / 100;
  const highPu = Math.round(pu * 1.5 * 100) / 100;
  const pur = getPurForYear(year);
  return {
    lowPu,
    highPu,
    lowGbp: Math.round(lowPu * pur * 100) / 100,
    highGbp: Math.round(highPu * pur * 100) / 100,
    coverage,
  };
}

function iaConfidence(pu: number, year: number, coverage: number): ConfidenceBand {
  const lowPu = Math.round(pu * 0.85 * 100) / 100;
  const highPu = Math.round(pu * 1.15 * 100) / 100;
  const pur = getPurForYear(year);
  return {
    lowPu,
    highPu,
    lowGbp: Math.round(lowPu * pur * 100) / 100,
    highGbp: Math.round(highPu * pur * 100) / 100,
    coverage,
  };
}

function baseIiaGaps(): GapField[] {
  return [
    {
      id: "heatmap.journey_count",
      label: "Journey count (heatmap)",
      impact: "high",
      description:
        "Number of customer journeys in scope — affects BA complexity scoring.",
    },
    {
      id: "context.dependencies",
      label: "Cross-programme dependencies",
      impact: "medium",
      description:
        "Upstream/downstream dependencies not fully documented in Vision Card.",
    },
    {
      id: "outcome.exclusions",
      label: "Explicit exclusions",
      impact: "low",
      description: "Out-of-scope items should be stated to avoid scope creep.",
    },
  ];
}

function baseIaGaps(): GapField[] {
  return [
    {
      id: "hld.integration_patterns",
      label: "Integration patterns (HLD)",
      impact: "high",
      description: "Apigee/MSA/Fusion reuse vs new-build not fully specified.",
    },
    {
      id: "requirements.non_functional",
      label: "Non-functional requirements",
      impact: "medium",
      description: "Performance, availability, and DR targets missing from spec.",
    },
  ];
}

function buildIiaLineItems(year: number): LineItem[] {
  const pur = getPurForYear(year);
  const line = (
    id: string,
    label: string,
    pu: number,
    ruleId: string,
    evidenceSpan: string,
  ): LineItem => ({
    id,
    label,
    pu,
    costGbp: Math.round(pu * pur * 100) / 100,
    provenance: { ruleId, evidenceSpan },
  });

  return [
    {
      ...line(
        "ba-score",
        "BA allocation — POPIT scoring",
        295.2,
        "ba-calculator.v1",
        "Offline Fixed Retentions Vision Card §Context → 4/5/4/3 + CIF+4",
      ),
      children: [
        line(
          "ba-customer",
          "Customer dimension",
          4,
          "ba-calculator.dimension.customer",
          "Vision Card §Context: multi-segment fixed base",
        ),
        line(
          "ba-process",
          "Process dimension",
          5,
          "ba-calculator.dimension.process",
          "Vision Card §Outcome: retention workflow changes",
        ),
        line(
          "ba-tech",
          "Technology dimension",
          4,
          "ba-calculator.dimension.technology",
          "Vision Card §Context: BSS + CRM integration",
        ),
        line(
          "ba-complexity",
          "Complexity dimension",
          3,
          "ba-calculator.dimension.complexity",
          "Vision Card §Outcome: moderate journey delta",
        ),
        line(
          "ba-cif",
          "CIF overlay",
          4,
          "ba-calculator.overlay.cif",
          "Vision Card §Value case: CIF accelerator flagged",
        ),
      ],
    },
    line(
      "sa-score",
      "SA pre-DoR effort",
      161,
      "sa-calculator.v1",
      "Vision Card §Sizing: strategic architecture to Definition of Ready",
    ),
    line(
      "seed-funding",
      "Seed funding total (BA + SA)",
      456.2,
      "seed-funding.v1",
      "Engine seedFunding: max(BA duration, SA duration) elapsed weeks",
    ),
  ];
}

function buildIaLineItems(year: number): LineItem[] {
  const pur = getPurForYear(year);
  const line = (
    id: string,
    label: string,
    pu: number,
    ruleId: string,
    evidenceSpan: string,
  ): LineItem => ({
    id,
    label,
    pu,
    costGbp: Math.round(pu * pur * 100) / 100,
    provenance: { ruleId, evidenceSpan },
  });

  return [
    {
      ...line(
        "retainx-base",
        "RetainX functional build-up",
        3202.2,
        "retainx-template.base",
        "IA spec §Functional scope → itemised screen/API counts",
      ),
      children: [
        line(
          "retainx-screens",
          "Dynamic screens (250 × factor)",
          1250,
          "retainx-template.screens",
          "HLD §UI: 250 dynamic screens @ 5 PU each (scaled)",
        ),
        line(
          "retainx-api",
          "APIGEE operations",
          525,
          "retainx-template.apigee",
          "HLD §Integration: 175 APIGEE ops",
        ),
        line(
          "retainx-overlay",
          "Complexity overlay vector",
          1427.2,
          "retainx-template.overlay",
          "packages/rules/retainx.yaml overlay vector applied",
        ),
      ],
    },
    line(
      "retainx-mgmt",
      "Management overlays (PM, warranty, contingency)",
      960.66,
      "retainx-template.management",
      "Template config: PM 15%, Warranty 5%, Contingency 10%",
    ),
    line(
      "retainx-total",
      "RetainX sign-off total",
      4162.86,
      "retainx-template.total",
      "Golden §3B: 4,162.86 PU = 832.572 person-weeks",
    ),
  ];
}

function resolveIiaHeadline(year: number, gapAnswers?: Record<string, string>) {
  const pu = 456.2;
  const answered = gapAnswers ? Object.keys(gapAnswers).length : 0;
  const coverage = Math.min(0.55 + answered * 0.12, 0.95);

  return {
    pu,
    costGbp: applyPur(pu, year),
    duration: "20+ weeks",
    band: "Very High",
    confidence: iiaConfidence(pu, year, coverage),
    lineItems: buildIiaLineItems(year),
    gaps: baseIiaGaps().filter((g) => !gapAnswers?.[g.id]),
    projectName: "OFR — Offline Fixed Retentions (mock)",
  };
}

function resolveIaHeadline(year: number, gapAnswers?: Record<string, string>) {
  const pu = 4162.86;
  const answered = gapAnswers ? Object.keys(gapAnswers).length : 0;
  const coverage = Math.min(0.72 + answered * 0.1, 0.98);

  return {
    pu,
    costGbp: applyPur(pu, year),
    duration: "Sign-off grade",
    band: "Calibrated IA",
    confidence: iaConfidence(pu, year, coverage),
    lineItems: buildIaLineItems(year),
    gaps: baseIaGaps().filter((g) => !gapAnswers?.[g.id]),
    projectName: "RetainX — Consumer Retention Platform (mock)",
  };
}

function pickFlowHint(fileName: string, requested: FlowType): FlowType {
  const lower = fileName.toLowerCase();
  if (lower.includes("retain") || lower.includes("ia") || lower.includes("hld")) {
    return "ia";
  }
  if (
    lower.includes("vision") ||
    lower.includes("ofr") ||
    lower.includes("offline") ||
    lower.includes("seed")
  ) {
    return "iia";
  }
  return requested;
}

export class MockAgentClient implements AgentClient {
  async estimate(request: EstimateRequest): Promise<EstimateResult> {
    await delay(800);
    const flow = pickFlowHint(request.file.name, request.flow);
    return this.buildResult(flow, request.year, request.gapAnswers);
  }

  async answerGaps(
    request: EstimateRequest & {
      sessionId: string;
      gapAnswers: Record<string, string>;
    },
  ): Promise<EstimateResult> {
    await delay(600);
    const flow = pickFlowHint(request.file.name, request.flow);
    return this.buildResult(flow, request.year, request.gapAnswers, request.sessionId);
  }

  private buildResult(
    flow: FlowType,
    year: number,
    gapAnswers?: Record<string, string>,
    existingSessionId?: string,
  ): EstimateResult {
    const pur = getPurForYear(year);
    const resolved =
      flow === "iia"
        ? resolveIiaHeadline(year, gapAnswers)
        : resolveIaHeadline(year, gapAnswers);

    const gaps = (flow === "iia" ? baseIiaGaps() : baseIaGaps()).filter(
      (g) => !gapAnswers?.[g.id],
    );

    return {
      sessionId: existingSessionId ?? sessionId(),
      flow,
      year,
      pur,
      projectName: resolved.projectName,
      headline: {
        pu: resolved.pu,
        costGbp: resolved.costGbp,
        duration: resolved.duration,
        band: resolved.band,
      },
      confidence: resolved.confidence,
      lineItems: resolved.lineItems,
      gaps,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
