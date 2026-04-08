#!/usr/bin/env python
# coding: utf-8

# ----------------------------  Final Work --------------------------------------------

# In[2]:


# ===================== IMPORT LIBRARIES =====================
import pandas as pd                     # For data handling
import numpy as np                      # For numerical operations
import matplotlib.pyplot as plt         # For plotting graphs

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error


# ===================== CLASS DEFINITION =====================
class SaffronMLModel:
    
    def __init__(self, file_path):
        # Store dataset path
        self.file_path = file_path
        
        # Initialize variables
        self.df = None                  # Full dataset
        self.X = None                   # Features
        self.y = None                   # Target
        
        # Default ML model (you can change here)
        self.model = GradientBoostingRegressor(random_state=42)

    
    # ===================== LOAD DATA =====================
    def load_data(self):
        # Read CSV file
        self.df = pd.read_csv(self.file_path)
        
        # Show first few rows (optional)
        print("\n📥 Data Preview:")
        print(self.df.head())

    
    # ===================== PREPROCESSING =====================
    def preprocess(self):
        # Fill missing values using column mean
        self.df = self.df.fillna(self.df.mean())
        
        # Separate input features and target variable
        self.X = self.df.drop("Growth", axis=1)
        self.y = self.df["Growth"]
        
        print("✅ Preprocessing done")

    
    # ===================== TRAIN-TEST SPLIT =====================
    def split_data(self, test_size=0.2):
        # Split dataset into training and testing
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=test_size, random_state=42
        )
        
        print("✅ Data split completed")

    
    # ===================== MODEL TRAINING =====================
    def train(self):
        # Train model using training data
        self.model.fit(self.X_train, self.y_train)
        
        print("✅ Model trained")

    
    # ===================== MODEL EVALUATION =====================
    def evaluate(self):
        # Predict using test data
        self.y_pred = self.model.predict(self.X_test)
        
        # Calculate evaluation metrics
        mse = mean_squared_error(self.y_test, self.y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(self.y_test, self.y_pred)
        r2 = r2_score(self.y_test, self.y_pred)
        
        # Train vs Test score (important for overfitting check)
        train_r2 = self.model.score(self.X_train, self.y_train)
        test_r2  = self.model.score(self.X_test, self.y_test)
        
        # Print results
        print("\n📊 Model Evaluation:")
        print("Train R2:", round(train_r2, 4))
        print("Test  R2:", round(test_r2, 4))
        print("MSE :", round(mse, 4))
        print("RMSE:", round(rmse, 4))
        print("MAE :", round(mae, 4))
        print("R2  :", round(r2, 4))
        
        # Overfitting / Underfitting detection
        if train_r2 - test_r2 > 0.1:
            print("⚠️ Warning: Possible Overfitting")
        elif train_r2 < 0.5 and test_r2 < 0.5:
            print("⚠️ Warning: Underfitting")
        else:
            print("✅ Model looks balanced")
        
        return r2

    
    # ===================== CROSS VALIDATION =====================
    def cross_validate(self):
        # Perform 5-fold cross validation
        scores = cross_val_score(self.model, self.X, self.y, cv=5, scoring='r2')
        
        print("\n🔁 Cross Validation R2 Scores:", scores)
        print("Average R2:", round(scores.mean(), 4))

    
    # ===================== FEATURE IMPORTANCE =====================
    def feature_importance(self):
        # Get importance values
        importance = self.model.feature_importances_
        features = self.X.columns
        
        # Create sorted DataFrame
        importance_df = pd.DataFrame({
            "Feature": features,
            "Importance": importance
        }).sort_values(by="Importance", ascending=True)
        
        print("\n📊 Feature Importance:")
        print(importance_df)
        
        # Plot feature importance
        plt.figure()
        plt.barh(importance_df["Feature"], importance_df["Importance"])
        plt.title("Feature Importance")
        plt.show()

    
    # ===================== LINE PLOT =====================
    def compare_predictions(self):
        plt.figure(figsize=(10, 5))
        
        # Plot actual values
        plt.plot(self.y_test.values[:50], label="Actual", marker='o')
        
        # Plot predicted values
        plt.plot(self.y_pred[:50], label="Predicted", linestyle="dashed")
        
        plt.title("Actual vs Predicted (First 50 Samples)")
        plt.xlabel("Index")
        plt.ylabel("Growth")
        plt.legend()
        plt.grid(True)
        plt.show()

    
    # ===================== SCATTER PLOT =====================
    def plot_scatter(self):
        plt.figure(figsize=(6,6))
        
        # Scatter plot
        plt.scatter(self.y_test, self.y_pred, alpha=0.7)
        
        plt.xlabel("Actual")
        plt.ylabel("Predicted")
        plt.title("Actual vs Predicted Scatter")
        
        # Perfect prediction line
        plt.plot([self.y_test.min(), self.y_test.max()],
                 [self.y_test.min(), self.y_test.max()])
        
        plt.grid(True)
        plt.show()

    
    # ===================== RESIDUAL PLOT =====================
    def plot_residuals(self):
        # Calculate residuals
        residuals = self.y_test - self.y_pred
        
        plt.figure(figsize=(8,5))
        plt.scatter(self.y_pred, residuals)
        
        # Zero reference line
        plt.axhline(y=0)
        
        plt.xlabel("Predicted")
        plt.ylabel("Residuals")
        plt.title("Residual Plot")
        
        plt.grid(True)
        plt.show()

        def compare_models(self):
            print("\n🤖 Comparing Models...")

            # Define models
            models = {
                "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
                "Gradient Boosting": GradientBoostingRegressor(random_state=42),
                "XGBoost": XGBRegressor(random_state=42)
            }

            results = {}

            # Train & evaluate each model
            for name, model in models.items():
                model.fit(self.X_train, self.y_train)
                y_pred = model.predict(self.X_test)
                
                r2 = r2_score(self.y_test, y_pred)
                results[name] = r2
                
                print(f"{name} R2 Score: {round(r2, 4)}")

            # Find best model
            best_model_name = max(results, key=results.get)
            best_score = results[best_model_name]

            print("\n🏆 Best Model:", best_model_name)
            print("Best R2 Score:", round(best_score, 4))

            # Save best model
            self.model = models[best_model_name]


# ===================== MAIN EXECUTION =====================

# Create objects for each phase dataset
phase1 = SaffronMLModel(r"C:\Users\soumy\OneDrive\Desktop\saffron_project\new_proper_code\ml_model\project_saffron\datasets\phase1_saffron.csv")
phase2 = SaffronMLModel(r"C:\Users\soumy\OneDrive\Desktop\saffron_project\new_proper_code\ml_model\project_saffron\datasets\phase2_saffron.csv")
phase3 = SaffronMLModel(r"C:\Users\soumy\OneDrive\Desktop\saffron_project\new_proper_code\ml_model\project_saffron\datasets\phase3_saffron.csv")
phase4 = SaffronMLModel(r"C:\Users\soumy\OneDrive\Desktop\saffron_project\new_proper_code\ml_model\project_saffron\datasets\phase4_saffron.csv")

# Store all phases in list
phases = [phase1, phase2, phase3, phase4]

# Store results
results = []

# Run pipeline for each phase
for i, phase in enumerate(phases, start=1):
    print(f"\n================= 🌱 PHASE {i} =================")
    
    phase.load_data()
    phase.preprocess()
    phase.split_data()
    phase.train()
    
    r2 = phase.evaluate()         
    phase.cross_validate()
    phase.compare_predictions()
    
    # Optional:
    # phase.feature_importance()
    # phase.plot_scatter()
    # phase.plot_residuals()
    
    results.append(r2)

# Final comparison
print("\n🏁 Final R2 Comparison Across Phases:")
for i, r2 in enumerate(results, start=1):
    print(f"Phase {i} R2 Score: {round(r2, 4)}")


# In[ ]:




