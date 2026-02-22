from fastapi import FastAPI, APIRouter, Depends, HTTPException
from app.config.jwt_auth import get_current_user
from app.models.email import (
    EmailRequest,
    EmailResponse,
    OrderConfirmationData,
    ShippingNotificationData,
    PasswordResetData,
    WelcomeEmailData,
    OrderPaidData,
    OrderDeliveredData,
    OrderCancelledData,
    OrderRefundedData
)
from app.services.email_service import email_service

app = FastAPI(title="Notification Service", version="0.1.0")

router = APIRouter(prefix="/api/notification")

@router.get("/health")
def health():
    return {"status": "ok"}

# Protected endpoint requiring JWT authentication
@router.post("/test")
def test_notification(current_user: dict = Depends(get_current_user)):
    return {"sent": True, "user": current_user["email"]}

@router.post("/email", response_model=EmailResponse)
async def send_generic_email(
    request: EmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a generic email (admin only for now)"""
    response = await email_service.send_email(request)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send email")
    return response

@router.post("/order-confirmation", response_model=EmailResponse)
async def send_order_confirmation_email(
    data: OrderConfirmationData,
    current_user: dict = Depends(get_current_user)
):
    """Send order confirmation email"""
    response = await email_service.send_order_confirmation(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send order confirmation")
    return response

@router.post("/shipping", response_model=EmailResponse)
async def send_shipping_notification_email(
    data: ShippingNotificationData,
    current_user: dict = Depends(get_current_user)
):
    """Send shipping notification email"""
    response = await email_service.send_shipping_notification(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send shipping notification")
    return response

@router.post("/password-reset", response_model=EmailResponse)
async def send_password_reset_email(data: PasswordResetData):
    """Send password reset email (public endpoint with rate limiting recommended)"""
    response = await email_service.send_password_reset(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send password reset")
    return response

@router.post("/welcome", response_model=EmailResponse)
async def send_welcome_email_endpoint(
    data: WelcomeEmailData,
    current_user: dict = Depends(get_current_user)
):
    """Send welcome email to new users"""
    response = await email_service.send_welcome_email(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send welcome email")
    return response

@router.post("/order-paid", response_model=EmailResponse)
async def send_order_paid_email(
    data: OrderPaidData,
    current_user: dict = Depends(get_current_user)
):
    """Send payment confirmation email"""
    response = await email_service.send_order_paid_email(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send payment confirmation")
    return response

@router.post("/order-delivered", response_model=EmailResponse)
async def send_order_delivered_email(
    data: OrderDeliveredData,
    current_user: dict = Depends(get_current_user)
):
    """Send delivery confirmation email"""
    response = await email_service.send_order_delivered_email(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send delivery confirmation")
    return response

@router.post("/order-cancelled", response_model=EmailResponse)
async def send_order_cancelled_email(
    data: OrderCancelledData,
    current_user: dict = Depends(get_current_user)
):
    """Send cancellation notification email"""
    response = await email_service.send_order_cancelled_email(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send cancellation notification")
    return response

@router.post("/order-refunded", response_model=EmailResponse)
async def send_order_refunded_email(
    data: OrderRefundedData,
    current_user: dict = Depends(get_current_user)
):
    """Send refund confirmation email"""
    response = await email_service.send_order_refunded_email(data)
    if response.status == "failed":
        raise HTTPException(status_code=500, detail="Failed to send refund confirmation")
    return response

app.include_router(router)

# Also expose a root-level health endpoint used by CI/tests
@app.get("/health")
def root_health():
    return {"status": "ok"}