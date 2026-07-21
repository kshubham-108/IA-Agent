import { loadRule, type TemplateYaml } from "./rules/loader.js";
import { estimateDfeDefault, estimateFromTemplate } from "./template-estimate.js";
import type { TemplateEstimateResult } from "./types.js";

export interface EstimateDfeInput {
  templateId: "retainx" | "o2t" | "dfe-default";
  basePu?: number;
}

export function estimateDfe(input: EstimateDfeInput): TemplateEstimateResult {
  if (input.templateId === "dfe-default") {
    const template = loadRule<TemplateYaml>("templates/dfe-default.yaml");
    const base = input.basePu ?? template.golden?.base_pu ?? 28;
    return estimateDfeDefault(base);
  }

  const template = loadRule<TemplateYaml>(`templates/${input.templateId}.yaml`);
  return estimateFromTemplate(template, input.basePu);
}
