from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr          # will reject non-email strings
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str        # the JWT
    user_id: str
    role: str
    full_name: str
    email: str

class IssueTicketCreate(BaseModel):
    category: Literal["facility", "computer"]  # only these two values allowed
    issue_name: str
    location: str
    description: Optional[str] = None
    image_url: Optional[str] = None   # this will be the public URL after upload

class FoundItemCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    category: Literal["Electronics", "Clothing", "School Supplies", "Personal Item"]
    location: str
    possession: Literal["security", "finder"]  # New field: where is the item now?

class ClaimCreate(BaseModel):
    proof_image_url: str

class StatusUpdate(BaseModel):
    status: str    # we'll validate the allowed values in the endpoint logic