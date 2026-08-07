"""FastAPI microservice exposing the trained XGBoost flood-risk model.

Next.js can't run XGBoost natively, so this lightweight Python API is the
bridge between the Next.js backend and the model.

Run from ml_service/ with:
    uvicorn api:app --reload --port 8000
"""

import os
import sys
import asyncio
from contextlib import asynccontextmanager

# Python 3.14 Windows fix: the default Proactor loop crashes accepts with
# WinError 10014. The Selector loop works around it until 3.16 removes it.
if sys.platform == "win32" and hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = os.path.join(os.path.dirname(__file__), "flood_xgboost_model.pkl")

# Column order MUST match the order used during training (train_model.py).
FEATURE_ORDER = [
    "cumulative_rainfall_72h",
    "river_level_trend",
    "soil_saturation_index",
    "elevation_m",
]
RISK_LABELS = ["Low", "Medium", "High", "Critical"]


class FloodFeatures(BaseModel):
    cumulative_rainfall_72h: float = Field(
        ge=0, description="Cumulative rainfall over the last 72h (mm)"
    )
    river_level_trend: float = Field(
        description="River level change over 72h (m)"
    )
    soil_saturation_index: float = Field(
        ge=0, le=1, description="Soil saturation index (0-1)"
    )
    elevation_m: float = Field(ge=0, description="Terrain elevation (m)")


class PredictionResponse(BaseModel):
    predicted_risk_class: int
    risk_level: str
    confidence_score: float
    probabilities: list[float]


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load(MODEL_PATH)
    yield


app = FastAPI(
    title="Disaster Response ML Engine",
    description="XGBoost flood-risk classifier (0=Low, 1=Medium, 2=High, 3=Critical)",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow the Next.js frontend to call this locally during the demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": hasattr(app.state, "model")}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: FloodFeatures):
    row = [[getattr(features, field) for field in FEATURE_ORDER]]
    proba = app.state.model.predict_proba(row)[0]
    class_idx = int(proba.argmax())
    return PredictionResponse(
        predicted_risk_class=class_idx,
        risk_level=RISK_LABELS[class_idx],
        confidence_score=float(proba[class_idx]),
        probabilities=[float(p) for p in proba],
    )
