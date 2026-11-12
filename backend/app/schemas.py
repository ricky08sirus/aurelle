import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name is too short")
        return v

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        v = re.sub(r"\D", "", v)
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone number must be exactly 10 digits")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str