"""Rule-Based PDF Flood Data Extractor — No API keys required.

Reads every PDF in ML_DATABASE, extracts numerical flood metrics via
regex patterns and keyword matching, and writes structured records
to historical_flood_data.csv.

This gives us REAL data from REAL PDFs without external API dependency.

Run from ml_service/:
    python extract_real_data.py
"""

import csv
import os
import re
import sys
from pathlib import Path
from pypdf import PdfReader

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DATABASE = SCRIPT_DIR.parent / "ML_DATABASE"
OUTPUT_CSV = SCRIPT_DIR / "real_extracted_data.csv"

CSV_COLUMNS = [
    "cumulative_rainfall_72h",
    "river_level_trend",
    "soil_saturation_index",
    "elevation_m",
    "risk_level",
]

# ---------------------------------------------------------------------------
# Keyword → severity mapping
# ---------------------------------------------------------------------------

CRITICAL_KEYWORDS = [
    "catastrophic", "devastating", "massive", "unprecedented", "extreme",
    "worst in", "death toll", "killed", "dead", "drowned", "evacuated",
    "submerged", "deluged", "emergency", "disaster", "collapse", "breach",
    "embankment breach", "tsunami", "catastrophe",
]

HIGH_KEYWORDS = [
    "severe", "major", "heavy", "intense", "widespread", "significant",
    "flooded", "overflow", "inundated", "high water", "flood level",
    "danger", "threat", "crisis", "emergency", "alert", "warning",
    "red alert", "orange alert",
]

MEDIUM_KEYWORDS = [
    "moderate", "rising", "above normal", "flood", "waterlogging",
    "rainfall", "monsoon", "water level", "stream", "river",
    "low-lying", "marshy", "wet", "saturation",
]

LOW_KEYWORDS = [
    "light", "minor", "minimal", "slight", "normal", "within",
    "below", "manageable", "contained", "receding", "retreating",
]


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from a PDF file using pypdf."""
    try:
        reader = PdfReader(str(pdf_path))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        print(f"  [WARN] Failed to read PDF: {e}")
        return ""


def find_rainfall_values(text: str) -> list[float]:
    """Extract rainfall measurements in mm from text."""
    values = []
    # Patterns: "150 mm", "150mm", "150 millimeters", "150 cm" (convert)
    patterns = [
        r'(\d+(?:\.\d+)?)\s*mm\b',
        r'(\d+(?:\.\d+)?)\s*millimeters?\b',
        r'(\d+(?:\.\d+)?)\s*cm\b',  # convert to mm
        r'rainfall\s*(?:of|:)\s*(\d+(?:\.\d+)?)',
        r'(\d+(?:\.\d+)?)\s*inches?\b',  # convert to mm (1 inch = 25.4mm)
    ]
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            val = float(m.group(1))
            if 'cm' in pat:
                val *= 10
            elif 'inch' in pat:
                val *= 25.4
            if 0 < val <= 2000:  # reasonable rainfall range
                values.append(round(val, 1))
    return values


def find_river_level_changes(text: str) -> list[float]:
    """Extract river level change (meters) from text."""
    values = []
    patterns = [
        r'(?:rose|rises?|increased?|jumped?|surged?)\s*(?:by|to)?\s*(\d+(?:\.\d+)?)\s*m(?:eters?)?\b',
        r'(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:rise|increase|surge|flood)',
        r'water\s*level\s*(?:of|at|reached?)\s*(\d+(?:\.\d+)?)\s*m(?:eters?)?',
        r'(\d+(?:\.\d+)?)\s*(?:feet|ft)\b',  # convert to meters
    ]
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            val = float(m.group(1))
            if 'feet' in pat or 'ft' in pat:
                val *= 0.3048
            if -5 < val < 30:  # reasonable river level change range
                values.append(round(val, 2))
    return values


def find_elevation(text: str) -> float | None:
    """Extract elevation (meters) from text, return average if multiple found."""
    values = []
    patterns = [
        r'elevation\s*(?:of|:|at)?\s*(\d+(?:\.\d+)?)\s*m(?:eters?)?\b',
        r'(\d+(?:\.\d+)?)\s*m\s*(?:above\s*sea\s*level|asl|a\.s\.l\.)',
        r'height\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*m(?:eters?)?\b',
    ]
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            val = float(m.group(1))
            if 0 < val <= 9000:  # reasonable elevation range
                values.append(val)
    return round(sum(values) / len(values), 0) if values else None


def classify_severity(text: str) -> int:
    """Classify text severity into risk_level (0-3) based on keywords."""
    text_lower = text.lower()

    critical_count = sum(1 for kw in CRITICAL_KEYWORDS if kw in text_lower)
    high_count = sum(1 for kw in HIGH_KEYWORDS if kw in text_lower)
    medium_count = sum(1 for kw in MEDIUM_KEYWORDS if kw in text_lower)
    low_count = sum(1 for kw in LOW_KEYWORDS if kw in text_lower)

    # Check death toll (strong signal for severity)
    death_match = re.search(r'(\d{2,5})\s*(?:killed|dead|drowned|death\s*toll)', text_lower)
    deaths = int(death_match.group(1)) if death_match else 0

    # Weighted scoring
    score = critical_count * 3 + high_count * 2 + medium_count * 1 - low_count * 0.5
    if deaths >= 100:
        score += 5
    elif deaths >= 30:
        score += 3
    elif deaths >= 10:
        score += 2

    if score >= 6:
        return 3  # Critical / Evacuate
    elif score >= 3:
        return 2  # High / Warning
    elif score >= 1:
        return 1  # Medium / Watch
    else:
        return 0  # Low / Safe


def estimate_soil_saturation(text: str, rainfall_mm: float) -> float:
    """Estimate soil saturation (0-1) from rainfall and text cues."""
    text_lower = text.lower()
    # Base estimate from rainfall
    if rainfall_mm > 300:
        base = 0.9
    elif rainfall_mm > 200:
        base = 0.8
    elif rainfall_mm > 100:
        base = 0.65
    elif rainfall_mm > 50:
        base = 0.5
    else:
        base = 0.3

    # Adjust for saturation keywords
    if any(kw in text_lower for kw in ["saturated", "waterlogged", "marshy", "soaked"]):
        base = min(1.0, base + 0.15)
    elif any(kw in text_lower for kw in ["dry", "parched", "drought"]):
        base = max(0.05, base - 0.2)
    elif any(kw in text_lower for kw in ["wet soil", "moist", "damp"]):
        base = min(1.0, base + 0.05)

    return round(min(1.0, max(0.0, base)), 2)


def process_pdf(pdf_path: Path) -> list[dict]:
    """Process a single PDF and return extracted records."""
    text = extract_text_from_pdf(pdf_path)
    if not text or len(text.strip()) < 100:
        return []

    records = []
    # Split text into ~2000-char chunks for analysis
    chunk_size = 2000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

    for chunk in chunks:
        rainfalls = find_rainfall_values(chunk)
        rivers = find_river_level_changes(chunk)
        elevation = find_elevation(chunk)
        severity = classify_severity(chunk)

        # Generate a record for each rainfall value found
        if rainfalls:
            for rain in rainfalls[:3]:  # max 3 per chunk
                soil = estimate_soil_saturation(chunk, rain)
                river_trend = rivers[0] if rivers else round(min(rain / 50, 3.0), 2)
                elev = elevation or 45  # default Bihar plain elevation
                records.append({
                    "cumulative_rainfall_72h": rain,
                    "river_level_trend": river_trend,
                    "soil_saturation_index": soil,
                    "elevation_m": elev,
                    "risk_level": severity,
                })
        elif rivers and severity >= 1:
            # River level change with severity but no explicit rainfall
            rain_est = round(rivers[0] * 50, 1)  # back-estimate rainfall
            soil = estimate_soil_saturation(chunk, rain_est)
            elev = elevation or 45
            records.append({
                "cumulative_rainfall_72h": rain_est,
                "river_level_trend": rivers[0],
                "soil_saturation_index": soil,
                "elevation_m": elev,
                "risk_level": severity,
            })

    # Deduplicate (exact matches)
    seen = set()
    unique = []
    for r in records:
        key = (r["cumulative_rainfall_72h"], r["river_level_trend"], r["risk_level"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return unique


def main():
    print("=" * 60)
    print("SafeSphere Rule-Based PDF Flood Data Extractor")
    print("Source: Real disaster PDFs from ML_DATABASE")
    print("=" * 60)

    pdfs = sorted(ML_DATABASE.rglob("*.pdf"))
    if not pdfs:
        print(f"\n[ERROR] No PDFs found in {ML_DATABASE}")
        sys.exit(1)

    print(f"Found {len(pdfs)} PDF files.\n")

    all_records = []
    success = 0
    failed = 0

    for i, pdf_path in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}] {pdf_path.name[:60]}", end=" ")
        try:
            records = process_pdf(pdf_path)
            if records:
                all_records.extend(records)
                success += 1
                print(f"→ {len(records)} records")
            else:
                failed += 1
                print("→ no data")
        except Exception as e:
            failed += 1
            print(f"→ ERROR: {e}")

    # Write CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for r in all_records:
            writer.writerow(r)

    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print(f"  PDFs processed : {len(pdfs)}")
    print(f"  With data      : {success}")
    print(f"  No data        : {failed}")
    print(f"  Total records  : {len(all_records)}")
    print(f"  Output CSV     : {OUTPUT_CSV}")

    # Class distribution
    if all_records:
        dist = {}
        for r in all_records:
            dist[r["risk_level"]] = dist.get(r["risk_level"], 0) + 1
        print(f"\n  Risk distribution:")
        labels = {0: "Low/Safe", 1: "Medium/Watch", 2: "High/Warning", 3: "Critical/Evacuate"}
        for k in sorted(dist.keys()):
            print(f"    Level {k} ({labels.get(k, '?')}): {dist[k]} records")

    print("=" * 60)

    if all_records:
        print(f"\nNext step: merge with synthetic data and run train_model.py")
    else:
        print("\n[WARN] No records extracted. PDFs may not contain extractable numerical data.")
        print("Consider running generate_data.py to create synthetic baseline.")


if __name__ == "__main__":
    main()
