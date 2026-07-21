#!/usr/bin/env python3
"""Build corpus/wall_of_reference.json and vision-cards index from source files."""

from __future__ import annotations

import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "corpus"
VISION_DIR = CORPUS / "vision-cards"
PARSED_DIR = CORPUS / "vision-cards-parsed"
XLSX = CORPUS / "Wall of Reference - Calibrated Projects.xlsx"
WALL_JSON = CORPUS / "wall_of_reference.json"
INDEX_JSON = CORPUS / "vision-cards-index.json"

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
WNS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

EXCLUDED_CALIBRATION = ["data-ncc-phase-4", "data-helix-datalake"]

PROJECT_ID_MAP = {
    "CCS Phase 2": "data-ccs-phase-2",
    "OFCOM Provider Net Act Equivalent for 360 Customers": "data-ofcom-net-act",
    "O2 Helix CMDB Integration": "data-helix-cmdb",
    "EDH FDP Data Quality Framework": "data-edh-fdp-dq",
    "ACE Landing PAD migration": "data-ace-landing-pad",
    "NCC Phase 4 Del": "data-ncc-phase-4",
    "Req for Data IA Helix Datalake": "data-helix-datalake",
    "Phase 2 CPE Inventory Project": "data-cpe-inventory",
    "Losing Provider Logic": "data-losing-provider",
    "Bulk Diagnostic API": "data-bulk-diagnostic",
    "Picasso": "data-picasso",
    "Augustus Bill Ops": "data-augustus-bill-ops",
    "Apollo as an AO FRAUD reporting": "data-apollo-fraud",
    "EDH > GCP": "data-edh-gcp",
    "Netpulse > GCP": "data-netpulse-gcp",
    "My O2 Mobile App Rebuild": "consumer-myo2",
    "RetainX": "consumer-retainx",
    "PayG Transformation": "consumer-payg-transformation",
    "PayG Communication": "consumer-payg-comms",
    "BSS Service Comms": "consumer-bss-comms",
    "O2.co.uk Transformation": "consumer-o2-website",
    "O2.co.uk Transformation ": "consumer-o2-website",
    "O2 Marketing Transformation": "consumer-o2-marketing",
    "APIGee onboarding API": "small-apigee",
    "APIGee onboarding API ": "small-apigee",
    "Migration of 10 content pages": "small-10-pages",
    "Affirm Onboarding": "small-affirm",
    "Migration from a legacy page within 360 to DFE web page for top up": "small-360-dfe-topup",
    "Recycle Arnold": "small-recycle",
}


def slug_id(project: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", project.strip().lower()).strip("-")
    return base[:64] or hashlib.sha1(project.encode()).hexdigest()[:12]


def col_row(ref: str) -> tuple[str, int]:
    match = re.match(r"([A-Z]+)(\d+)", ref)
    if not match:
        raise ValueError(ref)
    return match.group(1), int(match.group(2))


def read_xlsx_sheet(path: Path, sheet_path: str) -> dict[tuple[int, str], str | float]:
    with zipfile.ZipFile(path) as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall(".//m:si", NS):
                texts = [t.text or "" for t in si.findall(".//m:t", NS)]
                shared.append("".join(texts))
        sheet = ET.fromstring(z.read(sheet_path))
        cells: dict[tuple[int, str], str | float] = {}
        for cell in sheet.findall(".//m:sheetData/m:row/m:c", NS):
            ref = cell.attrib["r"]
            col, row = col_row(ref)
            value_el = cell.find("m:v", NS)
            if value_el is None or value_el.text is None:
                continue
            raw = value_el.text
            if cell.attrib.get("t") == "s":
                raw = shared[int(raw)]
            else:
                try:
                    raw = float(raw)
                except ValueError:
                    pass
            cells[(row, col)] = raw
        return cells


def build_wall_of_reference() -> dict:
    cells = read_xlsx_sheet(XLSX, "xl/worksheets/sheet2.xml")
    rows = []
    for row_num in range(7, 200):
        lot = cells.get((row_num, "B"), "")
        project = cells.get((row_num, "D"), "")
        if not project:
            continue
        project_name = str(project).strip()
        row_id = PROJECT_ID_MAP.get(project_name) or PROJECT_ID_MAP.get(project_name + " ") or slug_id(project_name)
        pu = float(cells.get((row_num, "H"), 0))
        estimated = float(cells.get((row_num, "I"), 0))
        actual = float(cells.get((row_num, "J"), 0))
        variance = cells.get((row_num, "K"), 0)
        rows.append(
            {
                "id": row_id,
                "lot": str(lot).strip(),
                "domain": str(cells.get((row_num, "C"), "")).strip(),
                "project": project_name,
                "size": str(cells.get((row_num, "F"), "")).strip(),
                "scopeSummary": str(cells.get((row_num, "G"), "")).strip(),
                "pu": pu,
                "estimatedCostGbp": round(estimated, 2),
                "actualCostGbp": round(actual, 2),
                "variance": float(variance) if variance != "" else None,
                "excludeFromCalibration": row_id in EXCLUDED_CALIBRATION,
                "provenance": {
                    "ruleId": "wall-of-reference.xlsx",
                    "evidenceSpan": f"TCS sheet row {row_num}: {project_name}",
                },
            }
        )

    small_items = [r for r in rows if r["id"].startswith("small-")]
    pack = {
        "items": [{"id": r["id"], "pu": r["pu"], "costGbp": r["estimatedCostGbp"]} for r in small_items],
        "totalPu": sum(r["pu"] for r in small_items),
        "totalCostGbp": round(sum(r["estimatedCostGbp"] for r in small_items), 2),
    }

    return {
        "pur": 425.52,
        "source": "corpus/Wall of Reference - Calibrated Projects.xlsx",
        "sheet": "Wall of Reference - TCS",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "excludedFromCalibration": EXCLUDED_CALIBRATION,
        "exclusionReason": "Infosys delivery / escalation discounts (§3A)",
        "rows": rows,
        "smallChangePack": pack,
    }


def extract_docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    parts = [t.text for t in root.findall(".//w:t", WNS) if t.text]
    return "\n".join(parts)


def extract_pdf_text(path: Path) -> str:
    data = path.read_bytes()
    chunks = re.findall(rb"\(([^\)\\]*(?:\\.[^\)\\]*)*)\)", data)
    parts = []
    for chunk in chunks:
        try:
            text = chunk.decode("utf-8", "ignore")
        except Exception:
            text = chunk.decode("latin-1", "ignore")
        text = text.replace("\\(", "(").replace("\\)", ")")
        if len(text.strip()) >= 2:
            parts.append(text)
    return "\n".join(parts)


def detect_format_variant(filename: str, text: str) -> str:
    probe = f"{filename} {text[:8000]}".lower()
    if "§1.1" in probe or "smart outcome" in probe:
        return "numbered-prototype"
    if "lean vision" in probe or "sbd phase 2" in probe:
        return "lean"
    if (
        "idea tracking" in probe
        or "prototype vision card 2026" in probe
        or "vision_card_template 2026" in probe
        or "vision card template 2026" in probe
    ):
        return "prototype-2026"
    return "unknown"


def build_vision_cards_index() -> dict:
    PARSED_DIR.mkdir(parents=True, exist_ok=True)
    cards = []
    for path in sorted(VISION_DIR.iterdir()):
        if path.suffix.lower() not in {".docx", ".pdf"}:
            continue
        if path.suffix.lower() == ".docx":
            text = extract_docx_text(path)
        else:
            text = extract_pdf_text(path)
        text_path = PARSED_DIR / f"{path.stem}.txt"
        text_path.write_text(text, encoding="utf-8")
        cards.append(
            {
                "id": hashlib.sha1(path.name.encode()).hexdigest()[:12],
                "filename": path.name,
                "relativePath": f"corpus/vision-cards/{path.name}",
                "parsedTextPath": f"corpus/vision-cards-parsed/{path.stem}.txt",
                "extension": path.suffix.lower().lstrip("."),
                "formatVariant": detect_format_variant(path.name, text),
                "sizeBytes": path.stat().st_size,
                "textLength": len(text),
                "textPreview": text[:240].replace("\n", " "),
            }
        )

    variants: dict[str, int] = {}
    for card in cards:
        variants[card["formatVariant"]] = variants.get(card["formatVariant"], 0) + 1

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceDir": "corpus/vision-cards",
        "count": len(cards),
        "formatVariantCounts": variants,
        "cards": cards,
    }


def main() -> None:
    wall = build_wall_of_reference()
    WALL_JSON.write_text(json.dumps(wall, indent=2), encoding="utf-8")
    index = build_vision_cards_index()
    INDEX_JSON.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"Wrote {WALL_JSON} ({len(wall['rows'])} rows)")
    print(f"Wrote {INDEX_JSON} ({index['count']} vision cards)")


if __name__ == "__main__":
    main()
