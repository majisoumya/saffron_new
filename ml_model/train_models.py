import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
import joblib
import os

datasets_dir = r"c:\Users\soumy\OneDrive\Desktop\saffron_project\new_proper_code\ml_model\datasets"
models_dir = r"c:\Users\soumy\OneDrive\Desktop\saffron_project\new_proper_code\ml_model\model"

# Make sure models dir exists
os.makedirs(models_dir, exist_ok=True)

phases = ["phase1", "phase2", "phase3", "phase4"]

for phase in phases:
    print(f"Training {phase} model...")
    csv_path = os.path.join(datasets_dir, f"{phase}_saffron.csv")
    
    # Load dataset
    df = pd.read_csv(csv_path)
    
    # Preprocess
    df = df.fillna(df.mean())
    X = df.drop("Growth", axis=1)
    y = df["Growth"]
    
    # Feature columns expected: Temperature, Humidity, Light, Soil_Moisture, CO2
    
    # Train model
    model = GradientBoostingRegressor(random_state=42)
    model.fit(X, y)
    
    # Save model
    model_path = os.path.join(models_dir, f"{phase}_model.pkl")
    joblib.dump(model, model_path)
    print(f"Saved {phase}_model.pkl")

print("All models trained and saved!")
