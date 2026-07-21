import { z } from "zod";

/** Extraction field status — no numeric estimate fields in extract schemas. */
export const FieldStatus = z.enum([
  "found",
  "inferred",
  "missing",
  "contradictory",
]);

export type FieldStatus = z.infer<typeof FieldStatus>;

export const ExtractedField = z.object({
  id: z.string(),
  value: z.string().nullable(),
  evidence_span: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  status: FieldStatus,
});

export type ExtractedField = z.infer<typeof ExtractedField>;

export const VisionCardFormatVariant = z.enum([
  "prototype-2026",
  "numbered-prototype",
  "lean",
  "unknown",
]);

export type VisionCardFormatVariant = z.infer<typeof VisionCardFormatVariant>;

export const PopitEvidence = z.object({
  customer: ExtractedField.optional(),
  peopleProcess: ExtractedField.optional(),
  technology: ExtractedField.optional(),
  complexity: ExtractedField.optional(),
  cif: ExtractedField.optional(),
  cdf: ExtractedField.optional(),
});

export type PopitEvidence = z.infer<typeof PopitEvidence>;

/** Vision Card extract — text/evidence only; no PU, £, band, or dimension scores. */
export const VisionCardExtract = z.object({
  formatVariant: VisionCardFormatVariant,
  fields: z.array(ExtractedField),
  popitEvidence: PopitEvidence.optional(),
});

export type VisionCardExtract = z.infer<typeof VisionCardExtract>;

export const HeatmapExtract = z.object({
  fields: z.array(ExtractedField),
});

export type HeatmapExtract = z.infer<typeof HeatmapExtract>;

export const IaSpecExtract = z.object({
  fields: z.array(ExtractedField),
});

export type IaSpecExtract = z.infer<typeof IaSpecExtract>;
