"""Train an XGBoost classifier on the synthetic flood dataset.

Loads historical_flood_data.csv, splits into train/test (stratified), trains
a gradient-boosted classifier over the 4 engineered features, prints accuracy
+ classification report, and exports the fitted model to
flood_xgboost_model.pkl via joblib.
"""

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

df = pd.read_csv(DATA_PATH)
X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
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

print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

joblib.dump(model, MODEL_PATH)
print(f"\nModel exported to {MODEL_PATH}")

importances = (
    pd.Series(model.feature_importances_, index=FEATURES)
    .sort_values(ascending=False)
)
print("\nFeature importances:")
print(importances)
