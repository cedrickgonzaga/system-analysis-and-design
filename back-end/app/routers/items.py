from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.database import supabase
from app.models import FoundItemCreate

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/")
async def report_item(data: FoundItemCreate, user=Depends(get_current_user)):
    supabase.table("found_items").insert({
        "poster_id": user["id"],
        "item_name": data.item_name,
        "description": data.description,
        "image_url": data.image_url,
        "category": data.category,
        "location": data.location,
        "status": "pending"  # needs security approval
    }).execute()
    return {"message": "Item reported"}

@router.get("/gallery")
async def get_gallery(user=Depends(get_current_user)):
    # Only approved items are shown in public gallery, include poster details
    res = supabase.table("found_items").select("*, poster:users(full_name, school_email)").eq("status", "approved").order("created_at", desc=True).execute()
    return res.data