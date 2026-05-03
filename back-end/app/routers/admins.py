from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user
from app.database import supabase
from app.models import StatusUpdate, ClaimerInfo
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

def check_role(user, allowed: list):
    if user["role"] not in allowed:
        raise HTTPException(status_code=403, detail="Forbidden")

@router.get("/tickets")
async def get_tickets(user=Depends(get_current_user)):
    check_role(user, ["it_admin", "facility_admin"])
    category = "computer" if user["role"] == "it_admin" else "facility"
    res = supabase.table("issue_tickets").select("*, reporter:users(full_name)").eq("category", category).order("created_at", desc=True).execute()
    return res.data

@router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: int, data: StatusUpdate, user=Depends(get_current_user)):
    check_role(user, ["it_admin", "facility_admin"])
    now_iso = datetime.utcnow().isoformat()
    supabase.table("issue_tickets").update({"status": data.status, "updated_at": now_iso}).eq("id", ticket_id).execute()
    return {"message": "Status updated"}

@router.get("/dashboard-stats")
async def dashboard_stats(user=Depends(get_current_user)):
    check_role(user, ["it_admin", "facility_admin"])
    category = "computer" if user["role"] == "it_admin" else "facility"
    tickets = supabase.table("issue_tickets").select("status").eq("category", category).execute().data
    pending = sum(1 for t in tickets if t["status"] == "Pending")
    in_progress = sum(1 for t in tickets if t["status"] == "In Progress")
    resolved = sum(1 for t in tickets if t["status"] == "Resolved")
    return {"pending": pending, "in_progress": in_progress, "resolved": resolved}

# Items management for security
@router.get("/items")
async def get_all_items(status: str = Query(None), user=Depends(get_current_user)):
    check_role(user, ["security"])
    query = supabase.table("found_items").select("*, poster:users(full_name, school_email)")
    if status:
        query = query.eq("status", status)
    res = query.order("created_at", desc=True).execute()
    return res.data

@router.patch("/items/{item_id}/status")
async def update_item_status(item_id: int, data: StatusUpdate, user=Depends(get_current_user)):
    check_role(user, ["security"])
    supabase.table("found_items").update({"status": data.status}).eq("id", item_id).execute()
    return {"message": "Item status updated"}

@router.delete("/items/{item_id}")
async def delete_item(item_id: int, user=Depends(get_current_user)):
    check_role(user, ["security"])
    supabase.table("found_items").delete().eq("id", item_id).execute()
    return {"message": "Item deleted"}

@router.patch("/items/{item_id}/mark-claimed/")
async def mark_item_claimed(item_id: int, data: ClaimerInfo, user=Depends(get_current_user)):
    try:
        check_role(user, ["security"])
        
        # 1. Update the item status
        supabase.table("found_items").update({
            "status": "claimed",
            "claimer_name": data.claimer_name,
            "claimer_email": data.claimer_email,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", item_id).execute()

        # 2. Insert into claims table to satisfy ERD and Audit requirements
        supabase.table("claims").insert({
            "item_id": item_id,
            "claimant_id": user["id"], # The admin recording the claim
            "status": "approved",
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        return {"message": "Item marked as claimed and record saved"}
    except Exception as e:
        print(f"Admin Mark Claimed Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Claims management
@router.get("/claims")
async def get_claims(status: str = Query(None), user=Depends(get_current_user)):
    check_role(user, ["security"])
    query = supabase.table("claims").select("*, found_items(item_name), claimant:users(full_name, school_email)")
    if status:
        query = query.eq("status", status)
    res = query.execute()
    return res.data

@router.patch("/claims/{claim_id}/status")
async def update_claim_status(claim_id: int, data: StatusUpdate, user=Depends(get_current_user)):
    check_role(user, ["security"])
    supabase.table("claims").update({"status": data.status}).eq("id", claim_id).execute()
    if data.status == "approved":
        # If approved, automatically mark item as claimed
        claim = supabase.table("claims").select("item_id").eq("id", claim_id).single().execute()
        if claim.data:
            supabase.table("found_items").update({"status": "claimed"}).eq("id", claim.data["item_id"]).execute()
    return {"message": "Claim status updated"}

# Summary
@router.get("/tickets/summary")
async def get_summary(month: str, user=Depends(get_current_user)):
    check_role(user, ["it_admin", "facility_admin"])
    category = "computer" if user["role"] == "it_admin" else "facility"
    
    # month is in YYYY-MM format
    # Use robust GTE/LT filtering for timestamp columns
    start_date = f"{month}-01T00:00:00"
    
    # Simple logic for next month to avoid complex calendar math
    year, mon = map(int, month.split("-"))
    if mon == 12:
        end_date = f"{year+1}-01-01T00:00:00"
    else:
        end_date = f"{year}-{mon+1:02d}-01T00:00:00"
    
    res = supabase.table("issue_tickets").select("*, reporter:users(full_name)") \
        .eq("category", category) \
        .eq("status", "Resolved") \
        .gte("updated_at", start_date) \
        .lt("updated_at", end_date) \
        .order("updated_at", desc=True) \
        .execute()
        
    return res.data