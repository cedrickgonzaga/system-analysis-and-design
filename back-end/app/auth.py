from fastapi import APIRouter, HTTPException, Depends
from app.models import UserRegister, UserLogin, TokenResponse
from app.database import supabase
from app.dependencies import get_current_user
import os
from supabase import create_client

router = APIRouter(prefix="/auth", tags=["auth"])

# Helper to create a fresh client just for auth to avoid mutating the global service client
def get_auth_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    return create_client(url, key)

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    auth_client = get_auth_client()
    # 1. Create the Supabase Auth user
    try:
        auth_response = auth_client.auth.sign_up({
            "email": data.email,
            "password": data.password
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Auth error: {str(e)}")

    if auth_response.user is None:
        raise HTTPException(status_code=400, detail="Registration failed")
    
    user_id = auth_response.user.id

    # 2. Create a row in our own 'users' table using the global service client
    try:
        full_name = f"{data.first_name} {data.last_name}"
        supabase.table("users").insert({
            "auth_id": user_id,
            "full_name": full_name,
            "school_email": data.email,
            "role": "standard"
        }).execute()
    except Exception as e:
        # If profile creation fails, we might want to know why
        raise HTTPException(status_code=500, detail=f"Profile creation failed: {str(e)}")

    # 3. Handle cases where email confirmation is enabled (session will be null)
    access_token = ""
    if auth_response.session:
        access_token = auth_response.session.access_token
    else:
        return {
            "access_token": "CONFIRM_EMAIL",
            "user_id": user_id,
            "role": "standard",
            "full_name": full_name,
            "email": str(data.email)
        }

    return {
        "access_token": access_token,
        "user_id": user_id,
        "role": "standard",
        "full_name": full_name,
        "email": str(data.email)
    }

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    auth_client = get_auth_client()
    try:
        auth_response = auth_client.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if auth_response.user is None:
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    if auth_response.session is None:
        raise HTTPException(status_code=400, detail="Please confirm your email before logging in.")

    user_id = auth_response.user.id
    try:
        profile = supabase.table("users").select("*").eq("auth_id", user_id).single().execute()
    except Exception as e:
        print(f"Profile fetch error: {e}")
        raise HTTPException(status_code=400, detail=f"Profile Error: {str(e)}")
        
    try:
        return {
            "access_token": auth_response.session.access_token,
            "user_id": user_id,
            "role": profile.data.get("role") or "standard",
            "full_name": profile.data.get("full_name") or "Unknown",
            "email": str(data.email)
        }
    except Exception as e:
        print(f"Unexpected error constructing login response: {e}")
        raise HTTPException(status_code=500, detail=f"Login response error: {str(e)}")

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user

# Mock forgot password
@router.post("/forgot-password")
async def forgot_password(email: str):
    # In production, call supabase.auth.reset_password_for_email(email)
    return {"message": "If that email exists, a reset link has been sent."}