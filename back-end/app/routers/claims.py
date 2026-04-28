from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import supabase
from app.models import ClaimCreate

router = APIRouter(prefix="/claims", tags=["claims"])

@router.post("/{item_id}")
async def claim_item(item_id: int, data: ClaimCreate, user=Depends(get_current_user)):
    # Check that item exists and is approved
    item = supabase.table("found_items").select("*").eq("id", item_id).single().execute()
    if not item.data or item.data["status"] != "approved":
        raise HTTPException(status_code=400, detail="Item not available for claim")
    supabase.table("claims").insert({
        "item_id": item_id,
        "claimant_id": user["id"],
        "proof_image_url": data.proof_image_url,
        "status": "pending"
    }).execute()
    return {"message": "Claim submitted"}

@router.get("/my")
async def my_claims(user=Depends(get_current_user)):
    res = supabase.table("claims").select("*, found_items(item_name, location)").eq("claimant_id", user["id"]).execute()
    return res.data