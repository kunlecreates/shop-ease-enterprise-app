from fastapi import FastAPI, APIRouter

app = FastAPI(title="Notification Service", version="0.1.0")

router = APIRouter(prefix="/api/notification")

@router.get("/health")
def health():
    return {"status": "ok"}

# Placeholder endpoint for sending notifications (to be implemented Phase 6)
@router.post("/test")
def test_notification():
    return {"sent": True}

app.include_router(router)

# Also expose a root-level health endpoint used by CI/tests
@app.get("/health")
def root_health():
    return {"status": "ok"}