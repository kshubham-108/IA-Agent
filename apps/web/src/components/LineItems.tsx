"use client";

import { useState } from "react";

import { formatGbp, formatPu } from "@/lib/format";
import type { LineItem } from "@/lib/types";

interface LineItemsProps {
  items: LineItem[];
}

function LineItemRow({
  item,
  nested = false,
}: {
  item: LineItem;
  nested?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="line-item">
      <div
        className={`line-item-row${nested ? " nested" : ""}`}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <span className="line-item-label">{item.label}</span>
        <span className="line-item-pu">{formatPu(item.pu)} PU</span>
        <span className="line-item-cost">{formatGbp(item.costGbp)}</span>
        <span className="line-item-toggle">{expanded ? "▾" : "▸"}</span>
      </div>
      {expanded && (
        <div className={`line-item-provenance${nested ? " nested" : ""}`}>
          <div>
            <strong>Rule:</strong> <code>{item.provenance.ruleId}</code>
          </div>
          <div style={{ marginTop: "0.25rem" }}>
            <strong>Evidence:</strong> {item.provenance.evidenceSpan}
          </div>
        </div>
      )}
      {hasChildren &&
        item.children!.map((child) => (
          <LineItemRow key={child.id} item={child} nested />
        ))}
    </div>
  );
}

export function LineItems({ items }: LineItemsProps) {
  return (
    <div className="line-items">
      {items.map((item) => (
        <LineItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
