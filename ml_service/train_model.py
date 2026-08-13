"""Train an XGBoost classifier on the historical flood dataset.

Loads historical_flood_data.csv — the real records appended by
extract_pdf_data.py (or the synthetic baseline from generate_data.py) — cleans
it with pandas (drops NaN and physically impossible rows so bad PDF extractions
can't crash training), splits into stratified train/test, trains a
gradient-boosted classifier over the 4 engineered features, prints the test
accuracy + classification report, and exports the fitted model to
flood_xgboost_model.pkl via joblib.

Run from ml_service/:
    python train_model.py
"""

import os
import sys

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

DATA_PATH = "historical_flood_data.csv"
MODEL_PATH = "flood_xgboost_model.pkl"
FEATURES = [
    "cumulative_rainfall_72h",
    "river_level_trend",
    "soil_saturation_index",
    "elevation_m",
]
TARGET = "risk_level"
CLASS_NAMES = ["Low", "Medium", "High", "Critical"]
VALID_RISK_LEVELS = {0, 1, 2, 3}
MIN_ROWS = 20  # below this there's no point training a classifier


def load_and_clean(path: str) -> tuple[pd.DataFrame, int]:
    """Read the CSV and return (clean_df, dropped_row_count).

    Cleaning steps:
      1. Drop rows with any missing (NaN) values — the extractor's LLM can
         emit partial records, and NaN crashes XGBoost at fit time.
      2. Coerce every feature to numeric; drop rows that fail to parse.
      3. Drop physically impossible values (negative rainfall, saturation
         outside 0-1) from bad extractions.
      4. Force the target to an integer 0-3 and drop anything else.
    """
    df = pd.read_csv(path)

    before = len(df)

    # 1) Missing values from bad PDF extractions.
    df = df.dropna().copy()

    # 2) Non-numeric garbage -> NaN, then drop it.
    for col in FEATURES + [TARGET]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=FEATURES + [TARGET])

    # 3) Physically impossible feature ranges.
    df = df[df["cumulative_rainfall_72h"] >= 0]     # rainfall can't be negative
    df = df[df["soil_saturation_index"].between(0.0, 1.0)]  # saturation is a ratio
    df = df[df["elevation_m"] >= 0]

    # 4) Target must be one of 0,1,2,3.
    df = df[df[TARGET].isin(VALID_RISK_LEVELS)]

    return df.reset_index(drop=True), before - len(df)


def main() -> None:
    # Pre-flight: verify the data file exists and has enough rows
    if not os.path.exists(DATA_PATH):
        sys.exit(
            f"[ERROR] {DATA_PATH} not found.\n"
            f"  Run generate_data.py (synthetic) or extract_pdf_data.py (real PDFs) first."
        )

    try:
        raw_df = pd.read_csv(DATA_PATH)
    except Exception as e:
        sys.exit(f"[ERROR] Failed to read {DATA_PATH}: {e}")

    if len(raw_df) < 10:
        sys.exit(
            f"[ERROR] Only {len(raw_df)} rows in {DATA_PATH} — need at least 10 "
            f"to train a model. Run extract_pdf_data.py to add more data."
        )

    print(f"Raw data loaded: {len(raw_df)} rows from {DATA_PATH}")

    df, dropped = load_and_clean(DATA_PATH)

    if len(df) < MIN_ROWS:
        sys.exit(
            f"Only {len(df)} usable rows in {DATA_PATH} (need at least "
            f"{MIN_ROWS}). Run extract_pdf_data.py first, then retry."
        )

    print(f"Loaded {DATA_PATH}: {len(df)} clean rows "
          f"({dropped} dropped by cleaning)")
    print("\nClass distribution (risk_level):")
    print(df[TARGET].value_counts().sort_index().to_string())

    X = df[FEATURES]
    y = df[TARGET].astype(int)

    # Stratified split — fall back to a random split if a class is too rare
    # in the (possibly small) extracted dataset for stratification.
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError:
        print("\nWarning: class too rare for a stratified split — "
              "using a random split instead.")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="mlogloss",
        early_stopping_rounds=20,
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

    joblib.dump(model, MODEL_PATH)

    print("=" * 60)
    print("SUCCESS: model retrained on historical_flood_data.csv")
    print(f"  Test accuracy : {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"  Training rows : {len(df)}")
    print(f"  Exported to   : {MODEL_PATH}")
    print("=" * 60)

    importances = (
        pd.Series(model.feature_importances_, index=FEATURES)
        .sort_values(ascending=False)
    )
    print("\nFeature importances:")
    print(importances)


if __name__ == "__main__":
    main()
