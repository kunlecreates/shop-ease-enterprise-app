from typing import Optional, List, Union
from pydantic import BaseModel, EmailStr, Field, field_validator

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    template: Optional[str] = None
    template_data: Optional[dict] = Field(default=None, alias="templateData")

    class Config:
        populate_by_name = True

class EmailResponse(BaseModel):
    message_id: str = Field(serialization_alias="messageId")
    status: str
    recipient: str
    success: bool = True

    class Config:
        populate_by_name = True

class OrderConfirmationData(BaseModel):
    order_id: Union[int, str] = Field(alias="orderId")
    customer_name: str = Field(alias="customerName")
    customer_email: EmailStr = Field(alias="customerEmail")
    order_total: float = Field(alias="total", default=0)
    items: List[dict]
    order_date: str = Field(alias="orderDate")

    class Config:
        populate_by_name = True

class ShippingNotificationData(BaseModel):
    order_id: Union[int, str] = Field(alias="orderId")
    customer_name: str = Field(alias="customerName")
    customer_email: EmailStr = Field(alias="customerEmail")
    tracking_number: Optional[str] = Field(default=None, alias="trackingNumber")
    estimated_delivery: Optional[str] = Field(default=None, alias="estimatedDelivery")

    class Config:
        populate_by_name = True

class PasswordResetData(BaseModel):
    email: EmailStr
    reset_token: str = Field(alias="resetToken")
    reset_url: str = Field(alias="resetUrl")
    expires_in_hours: int = Field(default=24, alias="expiresInHours")

    class Config:
        populate_by_name = True

class WelcomeEmailData(BaseModel):
    email: EmailStr
    username: str
    verification_url: Optional[str] = Field(default=None, alias="verificationUrl")

    class Config:
        populate_by_name = True

class OrderPaidData(BaseModel):
    order_id: Union[int, str] = Field(alias="orderId")
    customer_name: str = Field(alias="customerName")
    customer_email: EmailStr = Field(alias="customerEmail")
    order_total: float = Field(alias="orderTotal", default=0)
    order_url: Optional[str] = Field(default=None, alias="orderUrl")

    class Config:
        populate_by_name = True

class OrderDeliveredData(BaseModel):
    order_id: Union[int, str] = Field(alias="orderId")
    customer_name: str = Field(alias="customerName")
    customer_email: EmailStr = Field(alias="customerEmail")
    review_url: Optional[str] = Field(default=None, alias="reviewUrl")

    class Config:
        populate_by_name = True

class OrderCancelledData(BaseModel):
    order_id: Union[int, str] = Field(alias="orderId")
    customer_name: str = Field(alias="customerName")
    customer_email: EmailStr = Field(alias="customerEmail")
    support_url: Optional[str] = Field(default=None, alias="supportUrl")

    class Config:
        populate_by_name = True

class OrderRefundedData(BaseModel):
    order_id: Union[int, str] = Field(alias="orderId")
    customer_name: str = Field(alias="customerName")
    customer_email: EmailStr = Field(alias="customerEmail")
    refund_amount: float = Field(alias="refundAmount", default=0)

    class Config:
        populate_by_name = True
