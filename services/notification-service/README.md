# Notification Service (ShopEase)

FastAPI-based service for email/SMS notifications (mock in early phases).

## Running
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8084
```

## Deployment
See `helm/README.md` for Helm values and Secrets required in Kubernetes.