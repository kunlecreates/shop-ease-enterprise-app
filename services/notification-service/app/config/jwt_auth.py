import os
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-changeme")
ALGORITHM = "HS256"

def verify_jwt(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verify JWT token and return decoded payload.
    Raises HTTPException if token is invalid.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Extract user information from JWT token.
    Returns dict with userId, email, roles.
    """
    payload = verify_jwt(credentials)
    return {
        "userId": payload.get("sub"),
        "email": payload.get("email"),
        "roles": payload.get("roles", [])
    }
