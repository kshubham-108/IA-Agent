import { z } from "zod";

/** Extraction field status — no numeric estimate fields in extract schemas. */
export const FieldStatus = z.enum([
  "found",
  "inferred",
  "missing",
  "contradictory",
]);

export type FieldStatus = z.infer<typeof FieldStatus>;

/** Placeholder — Agent 2 will flesh out VisionCardExtract, HeatmapExtract, IaSpecExtract. */
export const VisionCardExtract = z.object({
  title: z.string().optional(),
});

export type VisionCardExtract = z.infer<typeof VisionCardExtract>;
