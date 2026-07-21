import { loadRule, type WallOfReferenceYaml } from "./rules/loader.js";

export interface WallOfReferenceNeighboursInput {
  projectName: string;
  limit?: number;
}

export function wallOfReferenceNeighbours(
  input: WallOfReferenceNeighboursInput,
) {
  const wall = loadRule<WallOfReferenceYaml>("wall-of-reference.yaml");
  const query = input.projectName.toLowerCase();
  const limit = input.limit ?? 3;
  const neighbours = wall.rows
    .filter((row) => row.project.toLowerCase().includes(query))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      project: row.project,
      lot: row.lot,
      pu: row.pu,
      costGbp: row.cost_gbp,
    }));

  return {
    query: input.projectName,
    pur: wall.pur,
    neighbours,
    provenance: [
      {
        ruleId: "wall-of-reference.rows",
        evidenceSpan: "packages/rules/wall-of-reference.yaml",
      },
    ],
  };
}
