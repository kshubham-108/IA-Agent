import type {
  ChecklistStatus,
  ClassifyDocumentResult,
  DocType,
} from "../../agent/lib/classify-documents.js";

export interface ClassificationCase {
  id: string;
  description: string;
  input: { filename: string; text: string };
  expected: {
    doc_type: DocType;
    requirements: ChecklistStatus;
    impact_areas: ChecklistStatus;
    hld: ChecklistStatus;
    minConfidence?: number;
  };
}

const VISION_ONLY_TEXT = `
Prototype Vision Card 2026.04
Idea Tracking — Title: Offline Fixed Retentions
Tracking ID: IDEA-OFR-001
Budget reference: FY26 Consumer Retention
Executive sponsor: Director Consumer Retention
Idea proposer: Product Lead
Products/services in scope: Fixed line retention journeys
Channels, processes, systems: offline save desk, CRM, billing
Current state: manual retention saves
Problem / opportunity: reduce churn on fixed base
Future vision / outcome: automated save offers at point of cancel
Beneficiaries: fixed customers
Exclusions: mobile prepaid
Dependencies: billing platform, offer catalogue
Journey counts: 4 core retention workflows
`;

const HEATMAP_TEXT = `
Solution Heatmap — Impact Areas
POPIT heatmap summary for Offline Fixed Retentions
Customer: High | People/Process: Very High | Technology: High | Complexity: Medium
CIF accelerators noted in footnotes
`;

const LEAN_VISION_TEXT = `
Lean Vision Card — Pega Cloud migration
Title: Pega Cloud migration
Future vision: move Pega workloads to cloud
Budget reference: TBC
`;

const HLD_TEXT = `
High-Level Design — RetainX Integration
Architecture overview for customer retention platform
Component diagram: API gateway, CRM adapter, offer engine
Detailed requirements for cutover and non-functional sizing
`;

const CONTRADICTORY_TEXT = `
Prototype Vision Card 2026.04
Products in scope: My O2 mobile app self-service journeys
Channels, processes, systems: mobile app, digital self-care
Exclusions: all mobile app channels excluded from scope
Future vision: expand mobile self-service
`;

const IRRELEVANT_TEXT = `
Weekly facilities request
Please restock the 3rd floor kitchen and book room B for HR policy briefing.
`;

export const CLASSIFICATION_CASES: ClassificationCase[] = [
  {
    id: "vision-only",
    description: "Vision card covers requirements; heatmap and HLD pending",
    input: { filename: "Offline_Fixed_Retentions_Vision_Card.docx", text: VISION_ONLY_TEXT },
    expected: {
      doc_type: "vision_card",
      requirements: "satisfied",
      impact_areas: "pending",
      hld: "pending",
      minConfidence: 0.8,
    },
  },
  {
    id: "vision-plus-heatmap",
    description: "Dedicated heatmap upload satisfies impact areas",
    input: { filename: "OFR_Solution_Heatmap.pdf", text: HEATMAP_TEXT },
    expected: {
      doc_type: "heatmap",
      requirements: "pending",
      impact_areas: "satisfied",
      hld: "pending",
      minConfidence: 0.7,
    },
  },
  {
    id: "thin-lean-card",
    description: "Lean vision card is partial on requirements manifest",
    input: { filename: "Pega_Cloud_Vision_Card.docx", text: LEAN_VISION_TEXT },
    expected: {
      doc_type: "vision_card",
      requirements: "partial",
      impact_areas: "pending",
      hld: "pending",
    },
  },
  {
    id: "hld-present",
    description: "HLD document satisfies HLD checklist item",
    input: { filename: "RetainX_HLD_v2.pdf", text: HLD_TEXT },
    expected: {
      doc_type: "hld",
      requirements: "pending",
      impact_areas: "pending",
      hld: "satisfied",
      minConfidence: 0.7,
    },
  },
  {
    id: "contradictory-pair",
    description: "Conflicting scope language flags contradictory requirements",
    input: { filename: "Contradictory_Vision_Card.docx", text: CONTRADICTORY_TEXT },
    expected: {
      doc_type: "vision_card",
      requirements: "contradictory",
      impact_areas: "pending",
      hld: "pending",
    },
  },
  {
    id: "irrelevant-doc",
    description: "Non-project document classified as other with pending checklist",
    input: { filename: "Facilities_Weekly_Status.pdf", text: IRRELEVANT_TEXT },
    expected: {
      doc_type: "other",
      requirements: "pending",
      impact_areas: "pending",
      hld: "pending",
    },
  },
];

export function assertClassificationCase(
  result: ClassifyDocumentResult,
  testCase: ClassificationCase,
): void {
  if (result.doc_type !== testCase.expected.doc_type) {
    throw new Error(
      `${testCase.id}: expected doc_type ${testCase.expected.doc_type}, got ${result.doc_type}`,
    );
  }
  if (
    result.checklist_coverage.requirements.status !== testCase.expected.requirements
  ) {
    throw new Error(
      `${testCase.id}: requirements expected ${testCase.expected.requirements}, got ${result.checklist_coverage.requirements.status}`,
    );
  }
  if (
    result.checklist_coverage.impact_areas.status !== testCase.expected.impact_areas
  ) {
    throw new Error(
      `${testCase.id}: impact_areas expected ${testCase.expected.impact_areas}, got ${result.checklist_coverage.impact_areas.status}`,
    );
  }
  if (result.checklist_coverage.hld.status !== testCase.expected.hld) {
    throw new Error(
      `${testCase.id}: hld expected ${testCase.expected.hld}, got ${result.checklist_coverage.hld.status}`,
    );
  }
  if (
    testCase.expected.minConfidence !== undefined &&
    result.confidence < testCase.expected.minConfidence
  ) {
    throw new Error(
      `${testCase.id}: confidence ${result.confidence} below ${testCase.expected.minConfidence}`,
    );
  }
}
