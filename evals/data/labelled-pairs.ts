export interface LabelledPairExpected {
  dimensions: {
    cust: number;
    pp: number;
    tech: number;
    comp: number;
    cif: number;
    cdf: number;
  };
  totalScore: number;
  pu2026: number;
  band: string;
}

export interface LabelledPairCase {
  id: string;
  visionCard: string;
  fixturePath: string;
  formatVariant: "prototype-2026" | "numbered-prototype" | "lean";
  expected: LabelledPairExpected;
  requiredGapFields?: string[];
  minDimensionsWithinTolerance: number;
}

export const LABELLED_PAIRS: LabelledPairCase[] = [
  {
    id: "ofr",
    visionCard: "Offline_Fixed_Retentions_Vision_Card_v1_0.docx",
    fixturePath: "evals/data/ofr.fixture.json",
    formatVariant: "prototype-2026",
    expected: {
      dimensions: { cust: 4, pp: 5, tech: 4, comp: 3, cif: 4, cdf: 0 },
      totalScore: 20,
      pu2026: 295.2,
      band: "Very High",
    },
    minDimensionsWithinTolerance: 3,
  },
  {
    id: "websafe",
    visionCard: "20260515_Vision_Card_Websafe_Strategic_Ver1_2.pdf",
    fixturePath: "evals/data/websafe.fixture.json",
    formatVariant: "numbered-prototype",
    expected: {
      dimensions: { cust: 2, pp: 2, tech: 5, comp: 3, cif: 2, cdf: -2 },
      totalScore: 12,
      pu2026: 65.6,
      band: "Medium High",
    },
    minDimensionsWithinTolerance: 3,
  },
  {
    id: "verint",
    visionCard: "Verint_Migration_to_Amazon_Connect_-_Vision_Card.docx",
    fixturePath: "evals/data/verint.fixture.json",
    formatVariant: "prototype-2026",
    expected: {
      dimensions: { cust: 1, pp: 1, tech: 3, comp: 1, cif: 1, cdf: -2 },
      totalScore: 5,
      pu2026: 49.2,
      band: "Medium",
    },
    minDimensionsWithinTolerance: 3,
  },
  {
    id: "pega",
    visionCard: "Pega_Cloud_Vision_Card_v1__1_.docx",
    fixturePath: "evals/data/pega.fixture.json",
    formatVariant: "lean",
    expected: {
      dimensions: { cust: 0, pp: 2, tech: 1, comp: 2, cif: 1, cdf: -4 },
      totalScore: 2,
      pu2026: 16.4,
      band: "Low",
    },
    requiredGapFields: ["budget_ref", "dependencies", "journey_counts", "heatmap"],
    minDimensionsWithinTolerance: 3,
  },
];

export function dimensionTolerance(
  actual: {
    customer?: number;
    peopleProcess?: number;
    technology?: number;
    complexity?: number;
    cust?: number;
    pp?: number;
    tech?: number;
    comp?: number;
  },
  expected: LabelledPairExpected["dimensions"],
): number {
  const pairs: Array<[number | undefined, number]> = [
    [actual.customer ?? actual.cust, expected.cust],
    [actual.peopleProcess ?? actual.pp, expected.pp],
    [actual.technology ?? actual.tech, expected.tech],
    [actual.complexity ?? actual.comp, expected.comp],
  ];
  return pairs.filter(([actualVal, exp]) =>
    actualVal !== undefined && Math.abs(actualVal - exp) <= 1,
  ).length;
}
