from fastapi import FastAPI

app = FastAPI(title="Notification Service", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok"}

# Placeholder endpoint for sending notifications (to be implemented Phase 6)
@app.post("/notifications/test")
def test_notification():
    return {"sent": True}