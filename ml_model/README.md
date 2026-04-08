# 🌱 Project Saffron: ML-Based Saffron Growth Prediction

## 📌 Overview
**Project Saffron** is a Machine Learning initiative designed to analyze and predict the growth of Saffron plants based on various environmental conditions. By analyzing datasets collected across four different phases, this project automatically evaluates and compares the most robust modeling techniques to help optimize saffron cultivation.

## 🗂️ Repository Structure

```text
📦 Project_Saffon
 ┣ 📂 datasets
 ┃ ┣ 📜 phase1_saffron.csv
 ┃ ┣ 📜 phase2_saffron.csv
 ┃ ┣ 📜 phase3_saffron.csv
 ┃ ┗ 📜 phase4_saffron.csv
 ┣ 📂 model
 ┃ ┣ 📓 comparing_model.ipynb  # Primary model comparison pipeline
 ┃ ┗ 📓 model.ipynb            # Individual model experimentation
 ┣ 📜 .gitignore
 ┗ 📜 README.md
```

## 📊 Dataset Features
The model accurately tracks and trains on vital surrounding environmental sensor readings:
- **Temperature:** Ambient temperature conditions.
- **Humidity:** Ambient air moisture parameters.
- **Light:** Intensity of light exposure the crops receive.
- **Soil Moisture:** Water content retained in the soil.
- **CO2:** Measurement of carbon dioxide concentration.
- **Growth (Target):** The tracked quantitative growth value the model aims to predict.

## 🤖 Machine Learning Pipeline
The python pipeline in `comparing_model.ipynb` utilizes `scikit-learn` and `xgboost` to execute a comprehensive data pipeline across 4 datasets:
1. **Data Preprocessing:** Fills missing values with column means & separates X/y.
2. **Train-Test Splitting:** Partitions into 80% training / 20% testing data.
3. **Model Selection:** Trains and tests multiple algorithms simultaneously:
    - *Random Forest Regressor*
    - *Gradient Boosting Regressor*
    - *XGBoost Regressor*
4. **Evaluation:** R2 Score, RMSE, and MAE calculation accompanied by active Overfitting/Underfitting detection heuristics.
5. **Cross-Validation:** 5-fold testing to reliably confirm stability and ensure against variance.
6. **Data Visualization:** Employs scatter (predictions vs actual) and continuous line plot visuals directly into the notebooks using `matplotlib`.

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3 installed. Use the following command to grab all necessary dependencies:
```bash
pip install pandas numpy matplotlib scikit-learn xgboost notebook
```

### Usage
1. Clone the repository:
   ```bash
   git clone https://github.com/Sayan-Official-32/project_saffron.git
   ```
2. Navigate into the repository:
   ```bash
   cd project_saffron
   ```
3. Boot up your Jupyter Notebook environment:
   ```bash
   jupyter notebook
   ```
4. Navigate and launch the `model/comparing_model.ipynb` file.

> **⚠️ Important Notice:** 
> Because Jupyter Notebooks use memory state, **always ensure you run the very first cell containing all library imports** before running the Machine Learning pipeline class down below to avoid `NameError` execution issues.
