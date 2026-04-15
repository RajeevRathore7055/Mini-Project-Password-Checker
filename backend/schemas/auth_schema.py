from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str


class LoginRequest(BaseModel):
    name:     str
    password: str


class UserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    is_active:  bool
    created_at: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    message: str
    token:   str
    user:    UserResponse
