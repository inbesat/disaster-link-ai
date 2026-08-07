"""Synthetic flood-risk dataset generator for the ML prediction engine.

Produces historical_flood_data.csv with n_rows training examples. The target
(risk_level: 0=Low, 1=Medium, 2=High, 3=Critical) is deliberately engineered
so it correlates with heavy 72h rainfall and low elevation — the same physics
that drive real flood risk — plus controllable noise so the model has to
generalise rather than memorise.
"""

import numpy as np
import pandas as pd

RNG_SEED = 42
OUT_PATH = "historical_flood_data.csv"


def generate_flood_dataset(n_rows: int = 1000) -> pd.DataFrame:
    rng = np.random.default_rng(RNG_SEED)

    # Heavy-tailed rainfall (gamma): most days dry/low, monsoon spikes to 300mm+.
    cumulative_rainfall_72h = rng.gamma(shape=3.0, scale=35.0, size=n_rows)

    # Saturation grows with rainfall, saturated at ~250mm/72h, plus measurement noise.
    soil_saturation_index = np.clip(
        cumulative_rainfall_72h / 250.0 + rng.normal(0, 0.08, size=n_rows), 0, 1
    )

    # River level trend (metres rising over 72h) driven by rain + saturation.
    river_level_trend = (
        cumulative_rainfall_72h * 0.012
        + (soil_saturation_index - 0.5) * 0.5
        + rng.normal(0, 0.35, size=n_rows)
    )

    # Low-lying flood plains (8-40m) are far riskier than elevated terrain (220m).
    elevation_m = rng.uniform(8, 220, size=n_rows)

    # Latent risk score: +rainfall/+trend/+saturation, -elevation, +noise.
    score = (
        np.log1p(cumulative_rainfall_72h) * 1.6
        + river_level_trend * 1.1
        + soil_saturation_index * 1.3
        - np.log1p(elevation_m) * 1.4
        + rng.normal(0, 0.6, size=n_rows)
    )

    # Thresholds give a realistic imbalanced class mix (~35/35/20/10):
    # most days are Low/Medium, Critical is the rare tail.
    quantiles = np.quantile(score, [0.35, 0.70, 0.90])
    risk_level = np.digitize(score, quantiles)

    return pd.DataFrame(
        {
            "cumulative_rainfall_72h": cumulative_rainfall_72h.round(2),
            "river_level_trend": river_level_trend.round(3),
            "soil_saturation_index": soil_saturation_index.round(4),
            "elevation_m": elevation_m.round(1),
            "risk_level": risk_level,
        }
    )


if __name__ == "__main__":
    df = generate_flood_dataset()
    df.to_csv(OUT_PATH, index=False)
    print(df.head())
    print("\nClass distribution (risk_level):")
    print(df["risk_level"].value_counts().sort_index())
    print(f"\nWrote {len(df)} rows to {OUT_PATH}")
