from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.database import supabase
from app.models import IssueTicketCreate

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/")
async def create_ticket(data: IssueTicketCreate, user=Depends(get_current_user)):
    # The 'user' dict comes from get_current_user, proving the caller is authenticated
    supabase.table("issue_tickets").insert({
        "reporter_id": user["id"],   # links to the user's profile
        "category": data.category,
        "issue_name": data.issue_name,
        "location": data.location,
        "description": data.description,
        "image_url": data.image_url,
        "status": "Pending"
    }).execute()
    return {"message": "Ticket created"}

@router.get("/my")
async def my_tickets(user=Depends(get_current_user)):
    res = supabase.table("issue_tickets").select("*").eq("reporter_id", user["id"]).order("created_at", desc=True).execute()
    return res.data

@router.get("/activity")
async def my_activity(user=Depends(get_current_user)):
    # Try to get both possible IDs from the user profile
    internal_id = user.get("id")
    auth_id = user.get("auth_id")
    
    # We'll search using a list of IDs that might be used as foreign keys
    search_ids = [id for id in [internal_id, auth_id] if id is not None]
    
    if not search_ids:
        return []

    activities = []
    
    try:
        # 1. Get facility/computer tickets - check both reporter_id formats
        tickets_query = supabase.table("issue_tickets").select("id, issue_name, location, created_at, status")
        if len(search_ids) > 1:
            tickets_res = tickets_query.or_(f"reporter_id.eq.{search_ids[0]},reporter_id.eq.{search_ids[1]}").execute()
        else:
            tickets_res = tickets_query.eq("reporter_id", search_ids[0]).execute()
        
        for t in (tickets_res.data or []):
            activities.append({
                "id": t["id"],
                "type": "Issue Report",
                "title": t.get("issue_name", "Untitled Issue"),
                "location": t.get("location", "N/A"),
                "date_submitted": t.get("created_at"),
                "status": t.get("status", "Pending")
            })

        # 2. Get items reported by this user
        items_query = supabase.table("found_items").select("id, item_name, location, created_at, status")
        if len(search_ids) > 1:
            items_res = items_query.or_(f"poster_id.eq.{search_ids[0]},poster_id.eq.{search_ids[1]}").execute()
        else:
            items_res = items_query.eq("poster_id", search_ids[0]).execute()
            
        for i in (items_res.data or []):
            activities.append({
                "id": i["id"],
                "type": "Found Item",
                "title": i.get("item_name", "Unknown Item"),
                "location": i.get("location", "N/A"),
                "date_submitted": i.get("created_at"),
                "status": i.get("status", "pending")
            })

        # 3. Get claims submitted by this user
        claims_query = supabase.table("claims").select("id, found_items(item_name, location), created_at, status")
        if len(search_ids) > 1:
            claims_res = claims_query.or_(f"claimant_id.eq.{search_ids[0]},claimant_id.eq.{search_ids[1]}").execute()
        else:
            claims_res = claims_query.eq("claimant_id", search_ids[0]).execute()
            
        for c in (claims_res.data or []):
            item_data = c.get("found_items") or {}
            activities.append({
                "id": c["id"],
                "type": "Item Claim",
                "title": item_data.get("item_name", "Unknown Item"),
                "location": item_data.get("location", "N/A"),
                "date_submitted": c.get("created_at"),
                "status": c.get("status", "pending")
            })

    except Exception as e:
        print(f"Error fetching activity: {e}")
        # Return what we have so far or empty
        return activities

    # Sort by date descending
    activities.sort(key=lambda x: str(x["date_submitted"] or ""), reverse=True)
    return activities