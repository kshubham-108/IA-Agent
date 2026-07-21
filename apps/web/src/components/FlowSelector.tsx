"use client";

import type { FlowType } from "@/lib/types";

interface FlowSelectorProps {
  value: FlowType;
  onChange: (flow: FlowType) => void;
  disabled?: boolean;
}

const OPTIONS: { value: FlowType; label: string; description: string }[] = [
  {
    value: "iia",
    label: "IIA / Seed Funding",
    description: "Vision Card + heatmap → pre-HLD seed funding",
  },
  {
    value: "ia",
    label: "IA (post-HLD)",
    description: "Requirements + HLD → sign-off grade line items",
  },
];

export function FlowSelector({ value, onChange, disabled }: FlowSelectorProps) {
  return (
    <div className="flow-selector" role="radiogroup" aria-label="Estimation flow">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`flow-option${value === opt.value ? " selected" : ""}`}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
        >
          <strong>{opt.label}</strong>
          <span>{opt.description}</span>
        </button>
      ))}
    </div>
  );
}
