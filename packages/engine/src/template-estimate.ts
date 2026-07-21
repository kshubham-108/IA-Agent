import { roundPu, sumVector, personWeeksFromPu } from "./math.js";
import type { ProvenanceStep, TemplateEstimateResult } from "./types.js";
import type { TemplateYaml } from "./rules/loader.js";

export function estimateFromTemplate(
  template: TemplateYaml,
  basePu?: number,
): TemplateEstimateResult {
  const base = basePu ?? template.base_pu;
  const vectorSum = sumVector(template.overlay_vector);
  const overlayPu = roundPu(base * vectorSum + template.fixed_add_pu);

  const provenance: ProvenanceStep[] = [
    {
      ruleId: `${template.id}.base`,
      evidenceSpan: `base_pu=${base}`,
      value: base,
      unit: "pu",
    },
    {
      ruleId: `${template.id}.overlay_vector`,
      evidenceSpan: `Σvector=${vectorSum} + fixed_add=${template.fixed_add_pu}`,
      value: overlayPu,
      unit: "pu",
    },
  ];

  let running = overlayPu;
  for (const [key, pct] of Object.entries(template.management_overlays)) {
    const add = roundPu(running * pct);
    provenance.push({
      ruleId: `${template.id}.management.${key}`,
      evidenceSpan: `${key}=${pct} × ${running}`,
      value: add,
      unit: "pu",
    });
  }

  const managementMultiplier =
    1 + sumVector(Object.values(template.management_overlays));
  const totalPu = roundPu(overlayPu * managementMultiplier);

  provenance.push({
    ruleId: `${template.id}.total`,
    evidenceSpan: `${overlayPu} × ${managementMultiplier}`,
    value: totalPu,
    unit: "pu",
  });

  const lineItems = provenance.map((step, index) => ({
    id: `${template.id}-line-${index}`,
    pu: step.value,
    ruleId: step.ruleId,
    evidenceSpan: step.evidenceSpan,
  }));

  return {
    totalPu,
    personWeeks: personWeeksFromPu(totalPu),
    lineItems,
    provenance,
  };
}

export function estimateDfeDefault(basePu: number): TemplateEstimateResult {
  const baseMultiplier = 2.3;
  const overlayMultiplier = 1.35;
  const afterBase = roundPu(basePu * baseMultiplier);
  const totalPu = roundPu(afterBase * overlayMultiplier);

  const provenance: ProvenanceStep[] = [
    {
      ruleId: "dfe-default.base_multiplier",
      evidenceSpan: `${basePu} × ${baseMultiplier}`,
      value: afterBase,
      unit: "pu",
    },
    {
      ruleId: "dfe-default.overlay_multiplier",
      evidenceSpan: `${afterBase} × ${overlayMultiplier}`,
      value: totalPu,
      unit: "pu",
    },
  ];

  return {
    totalPu,
    personWeeks: personWeeksFromPu(totalPu),
    lineItems: provenance.map((step, index) => ({
      id: `dfe-default-${index}`,
      pu: step.value,
      ruleId: step.ruleId,
      evidenceSpan: step.evidenceSpan,
    })),
    provenance,
  };
}
