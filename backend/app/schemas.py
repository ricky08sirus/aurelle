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
        v = re.sub(r"[\s\-()]", "", v)
        if not re.fullmatch(r"\+[1-9]\d{9,14}", v):
            raise ValueError("Phone must include country code, e.g. +919876543210")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str