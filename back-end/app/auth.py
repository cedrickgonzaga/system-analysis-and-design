from fastapi import APIRouter, HTTPException, Depends
from app.models import UserRegister, UserLogin, TokenResponse
from app.database import supabase
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    # 1. Create the Supabase Auth user (stores email and hashed password)
    auth_response = supabase.auth.sign_up({
        "email": data.email,
        "password": data.password
    })
    if auth_response.user is None:
        raise HTTPException(status_code=400, detail="Registration failed")
    user_id = auth_response.user.id

    # 2. Create a row in our own 'users' table with role 'standard'
    full_name = f"{data.first_name} {data.last_name}"
    supabase.table("users").insert({
        "auth_id": user_id,
        "full_name": full_name,
        "school_email": data.email,
        "role": "standard"
    }).execute()

    # 3. Return the access token + user details so the frontend can log in immediately
    return {
        "access_token": auth_response.session.access_token,
        "user_id": user_id,
        "role": "standard",
        "full_name": full_name,
        "email": data.email
    }

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    auth_response = supabase.auth.sign_in_with_password({
        "email": data.email,
        "password": data.password
    })
    if auth_response.user is None:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    user_id = auth_response.user.id
    profile = supabase.table("users").select("*").eq("auth_id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=400, detail="User profile not found")
    return {
        "access_token": auth_response.session.access_token,
        "user_id": user_id,
        "role": profile.data["role"],
        "full_name": profile.data["full_name"],
        "email": data.email
    }

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user

# Mock forgot password
@router.post("/forgot-password")
async def forgot_password(email: str):
    # In production, call supabase.auth.reset_password_for_email(email)
    return {"message": "If that email exists, a reset link has been sent."}