"""PDF Disaster Data Extractor — LLM-powered pipeline.

Reads every PDF in the ML_DATABASE folder, uses an LLM (Groq primary,
OpenAI fallback) to extract historical flood metrics, and appends the
structured results to ml_service/historical_flood_data.csv.

Run from ml_service/:
    python extract_pdf_data.py

The script is fully crash-proof: bad PDFs or LLM failures are logged
and skipped without stopping the pipeline.
"""

import csv
import json
import os
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Relative to this script's directory
SCRIPT_DIR = Path(__file__).resolve().parent
ML_DATABASE = SCRIPT_DIR.parent / "ML_DATABASE"
OUTPUT_CSV = SCRIPT_DIR / "historical_flood_data.csv"

# CSV columns — must match train_model.py FEATURE_ORDER + TARGET
CSV_COLUMNS = [
    "cumulative_rainfall_72h",
    "river_level_trend",
    "soil_saturation_index",
    "elevation_m",
    "risk_level",
]

# LLM extraction system prompt
EXTRACTION_SYSTEM_PROMPT = """You are a historical disaster data extractor. Given text from a disaster report, extract historical flood metrics.

Return ONLY a valid JSON array of objects with these exact keys:
- cumulative_rainfall_72h (float, mm): Total rainfall over 72 hours. If the text mentions daily rainfall, multiply by 3.
- river_level_trend (float, meters): River level change/rise over 72 hours. Positive = rising.
- soil_saturation_index (float, 0-1): Soil moisture/saturation. 0 = dry, 1 = fully saturated. Estimate from rainfall intensity and flood severity.
- risk_level (int, 0-3): 0=Low/Safe, 1=Medium/Watch, 2=High/Warning, 3=Critical/Evacuate.

Make intelligent estimates based on the text if exact numbers are not present.
- Light rainfall (<50mm/72h) with minor flooding → risk_level 0-1
- Moderate rainfall (50-150mm/72h) with river rising → risk_level 1-2
- Heavy rainfall (150-300mm/72h) with significant flooding → risk_level 2-3
- Extreme rainfall (>300mm/72h) with major disaster → risk_level 3

Return: [{"cumulative_rainfall_72h": float, "river_level_trend": float, "soil_saturation_index": float, "elevation_m": float, "risk_level": int}, ...]

If the text contains multiple distinct events, return multiple objects.
If you cannot extract any meaningful data, return an empty array: []
"""


# ---------------------------------------------------------------------------
# PDF text extraction (pypdf — already in requirements.txt)
# ---------------------------------------------------------------------------

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(pdf_path))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        print(f"  [WARN] Failed to read PDF {pdf_path.name}: {e}")
        return ""


# ---------------------------------------------------------------------------
# LLM extraction (Groq primary, OpenAI fallback)
# ---------------------------------------------------------------------------

def extract_with_groq(text: str) -> list[dict] | None:
    """Use Groq API to extract structured data from text."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        import httpx
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Extract disaster metrics from this text:\n\n{text[:6000]}"},
                ],
                "temperature": 0.1,
                "max_tokens": 2048,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return _parse_json_response(content)
    except Exception as e:
        print(f"  [WARN] Groq extraction failed: {e}")
        return None


def extract_with_openai(text: str) -> list[dict] | None:
    """Use OpenAI API as fallback to extract structured data."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract disaster metrics from this text:\n\n{text[:6000]}"},
            ],
            temperature=0.1,
            max_tokens=2048,
        )
        content = response.choices[0].message.content
        return _parse_json_response(content)
    except Exception as e:
        print(f"  [WARN] OpenAI extraction failed: {e}")
        return None


def _parse_json_response(content: str) -> list[dict] | None:
    """Parse JSON from LLM response, handling markdown code blocks."""
    # Strip markdown code fences if present
    cleaned = content.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last lines (fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
        return None
    except json.JSONDecodeError:
        # Try to find a JSON array in the response
        import re
        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return None


def extract_data_from_text(text: str) -> list[dict]:
    """Try Groq first, then OpenAI fallback."""
    result = extract_with_groq(text)
    if result is not None:
        return result
    result = extract_with_openai(text)
    if result is not None:
        return result
    return []


# ---------------------------------------------------------------------------
# Data validation
# ---------------------------------------------------------------------------

def validate_record(record: dict) -> dict | None:
    """Validate and sanitize a single extracted record. Returns None if invalid."""
    required_keys = ["cumulative_rainfall_72h", "river_level_trend",
                     "soil_saturation_index", "elevation_m", "risk_level"]

    # Check all required keys exist
    for key in required_keys:
        if key not in record:
            return None

    try:
        validated = {
            "cumulative_rainfall_72h": max(0, float(record["cumulative_rainfall_72h"])),
            "river_level_trend": float(record["river_level_trend"]),
            "soil_saturation_index": max(0, min(1, float(record["soil_saturation_index"]))),
            "elevation_m": max(0, float(record["elevation_m"])),
            "risk_level": max(0, min(3, int(record["risk_level"]))),
        }
        return validated
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def find_pdfs(database_path: Path) -> list[Path]:
    """Recursively find all PDF files in the database folder."""
    pdfs = []
    if not database_path.exists():
        print(f"[ERROR] ML_DATABASE folder not found at: {database_path}")
        return pdfs
    for pdf in database_path.rglob("*.pdf"):
        pdfs.append(pdf)
    return sorted(pdfs)


def main():
    print("=" * 60)
    print("SafeSphere PDF Disaster Data Extractor")
    print("=" * 60)

    # Check for LLM API keys
    has_groq = bool(os.environ.get("GROQ_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))
    if not has_groq and not has_openai:
        print("\n[ERROR] No LLM API key found. Set GROQ_API_KEY or OPENAI_API_KEY.")
        print("  export GROQ_API_KEY=your-key-here")
        sys.exit(1)
    print(f"\nLLM Provider: {'Groq' if has_groq else 'OpenAI'}{' + OpenAI fallback' if has_groq and has_openai else ''}")

    # Find PDFs
    pdfs = find_pdfs(ML_DATABASE)
    if not pdfs:
        print(f"\n[ERROR] No PDF files found in {ML_DATABASE}")
        sys.exit(1)
    print(f"Found {len(pdfs)} PDF files to process.\n")

    # Prepare CSV output (append if exists, create if not)
    csv_exists = OUTPUT_CSV.exists() and OUTPUT_CSV.stat().st_size > 0
    csv_file = open(OUTPUT_CSV, "a", newline="", encoding="utf-8")
    writer = csv.DictWriter(csv_file, fieldnames=CSV_COLUMNS)
    if not csv_exists:
        writer.writeheader()

    total_records = 0
    success_files = 0
    failed_files = 0

    for i, pdf_path in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}] Processing: {pdf_path.name}")

        # Extract text
        text = extract_text_from_pdf(pdf_path)
        if not text or len(text.strip()) < 50:
            print(f"  [SKIP] No meaningful text extracted ({len(text)} chars)")
            failed_files += 1
            continue

        # Extract structured data via LLM
        try:
            records = extract_data_from_text(text)
        except Exception as e:
            print(f"  [SKIP] LLM extraction failed: {e}")
            failed_files += 1
            time.sleep(2)
            continue

        if not records:
            print(f"  [SKIP] No data extracted from this PDF")
            failed_files += 1
            time.sleep(2)
            continue

        # Validate and write records
        written = 0
        for record in records:
            validated = validate_record(record)
            if validated:
                writer.writerow(validated)
                written += 1

        total_records += written
        success_files += 1
        print(f"  [OK] Extracted {written} record(s)")

        # Rate limit protection: 2 seconds between API calls
        time.sleep(2)

    csv_file.close()

    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print(f"  Files processed : {len(pdfs)}")
    print(f"  Successful      : {success_files}")
    print(f"  Skipped/Failed  : {failed_files}")
    print(f"  Total records   : {total_records}")
    print(f"  Output CSV      : {OUTPUT_CSV}")
    print("=" * 60)

    if total_records == 0:
        print("\n[WARN] No records extracted. Check your API keys and PDF content.")
    else:
        print(f"\nNext step: python train_model.py")


if __name__ == "__main__":
    main()
