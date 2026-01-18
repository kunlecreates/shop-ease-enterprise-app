from typing import Optional, List
from pydantic import BaseModel, EmailStr

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    template: Optional[str] = None
    template_data: Optional[dict] = None

class EmailResponse(BaseModel):
    message_id: str
    status: str
    recipient: str

class OrderConfirmationData(BaseModel):
    order_id: int
    customer_name: str
    customer_email: EmailStr
    order_total: float
    items: List[dict]
    order_date: str

class ShippingNotificationData(BaseModel):
    order_id: int
    customer_name: str
    customer_email: EmailStr
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[str] = None

class PasswordResetData(BaseModel):
    email: EmailStr
    reset_token: str
    reset_url: str
    expires_in_hours: int = 24

class WelcomeEmailData(BaseModel):
    email: EmailStr
    username: str
    verification_url: Optional[str] = None
