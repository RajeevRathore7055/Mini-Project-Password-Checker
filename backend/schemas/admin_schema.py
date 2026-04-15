from pydantic import BaseModel, EmailStr
from typing import Optional


class AddUserRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    role:     Optional[str] = "user"


class ChangeRoleRequest(BaseModel):
    role: str


class Config:
    from_attributes = True
