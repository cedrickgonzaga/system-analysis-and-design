from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify the token and get the auth user
        user = supabase.auth.get_user(token)
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        # Get the matching profile row from our own users table
        profile = supabase.table("users").select("*").eq("auth_id", user.id).single().execute()
        return profile.data   # contains id, auth_id, full_name, role, etc.
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")