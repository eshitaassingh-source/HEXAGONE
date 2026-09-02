from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

alerts = []

class Alert(BaseModel):
    track_id: int
    alert_type: str

@app.get("/")
def home():
    return {"status": "IBVAP backend running"}

@app.post("/alert")
def create_alert(alert: Alert):
    entry = {
        "track_id": alert.track_id,
        "alert_type": alert.alert_type,
        "timestamp": datetime.now().isoformat()
    }
    alerts.append(entry)
    print(f"New alert logged: {entry}")
    return entry

@app.get("/alerts")
def get_alerts():
    return alerts