import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

app = FastAPI()

# Allow CORS for your frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Configuration
URL = "https://jhgnrbujsggsllzkgsfb.supabase.co"
KEY = "sb_publishable_RnCtzZEfz-BYwDZ7_X73iw_Q_hdk44_"
supabase: Client = create_client(URL, KEY)

@app.get("/api/sensors")
def get_latest_sensors():
    """
    Fetches the latest sensor data from the Supabase database.
    """
    try:
        response = supabase.table("sensor_data").select("*").order("created_at", desc=True).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return {"error": "No data found"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/actuators")
def get_actuators():
    """
    Fetches the actuator values from the Supabase database.
    """
    try:
        response = supabase.table("actuators").select("*").eq("id", 1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return {"error": "No actuators logic found"}
    except Exception as e:
        return {"error": str(e)}

from pydantic import BaseModel
from typing import Optional

class ActuatorUpdate(BaseModel):
    mist_maker: Optional[bool] = None
    fan: Optional[bool] = None
    grow_light_pwm: Optional[int] = None
    auto_mode: Optional[bool] = None
    relay_1: Optional[bool] = None
    relay_2: Optional[bool] = None

@app.post("/api/actuators")
def update_actuators(data: ActuatorUpdate):
    """
    Updates the actuator values in the Supabase database.
    """
    try:
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        if not update_data:
            return {"error": "No fields to update"}
            
        response = supabase.table("actuators").update(update_data).eq("id", 1).execute()
        
        if response.data:
            return {"status": "success", "data": response.data[0]}
        return {"error": "Update failed (maybe no row with id=1?)"}
    except Exception as e:
        return {"error": str(e)}

# Mount the static frontend directory to the root path
# We do this after all API routes so they are evaluated first
frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)

