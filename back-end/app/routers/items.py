from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import supabase
from app.models import FoundItemCreate, ClaimerInfo
from datetime import datetime

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
        "possession": data.possession,  # Save where the item is
        "status": "pending"  # needs security approval
    }).execute()
    return {"message": "Item reported"}

@router.get("/gallery")
async def get_gallery(user=Depends(get_current_user)):
    # Only approved items are shown in public gallery, include poster details
    res = supabase.table("found_items").select("*, poster:users(full_name, school_email, id, auth_id)").eq("status", "approved").order("created_at", desc=True).execute()
    return res.data

@router.patch("/{item_id}/mark-claimed/")
async def mark_my_item_claimed(item_id: int, data: ClaimerInfo, user=Depends(get_current_user)):
    try:
        # 1. Verify this user is the one who posted the item
        item = supabase.table("found_items").select("poster_id").eq("id", item_id).single().execute()
        
        if not item.data:
            raise HTTPException(status_code=404, detail="Item not found")
            
        # We check against both possible ID formats for robustness
        if str(item.data["poster_id"]) != str(user.get("id")) and str(item.data["poster_id"]) != str(user.get("auth_id")):
            raise HTTPException(status_code=403, detail="You can only mark your own items as claimed")

        # 2. Update the item status
        supabase.table("found_items").update({
            "status": "claimed",
            "claimer_name": data.claimer_name,
            "claimer_email": data.claimer_email,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", item_id).execute()

        # 3. Record the handover in the claims table
        supabase.table("claims").insert({
            "item_id": item_id,
            "claimant_id": user.get("id") or user.get("auth_id"),
            "status": "approved",
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {"message": "Item marked as claimed and log recorded"}
    except Exception as e:
        print(f"Error marking item as claimed: {e}")
        raise HTTPException(status_code=500, detail=str(e))