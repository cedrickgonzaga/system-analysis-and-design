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
    # Get tickets for this user
    tickets = supabase.table("issue_tickets").select("id, issue_name, location, created_at, status").eq("reporter_id", user["id"]).execute().data
    # Get claims with item name via a join
    claims = supabase.table("claims").select("id, found_items!inner(item_name, location), created_at, status").eq("claimant_id", user["id"]).execute().data

    activities = []
    for t in tickets:
        activities.append({
            "id": t["id"],
            "type": "Ticket",
            "title": t["issue_name"],
            "location": t["location"],
            "date_submitted": t["created_at"],
            "status": t["status"]
        })
    for c in claims:
        activities.append({
            "id": c["id"],
            "type": "Claim",
            "title": c["found_items"]["item_name"],
            "location": c["found_items"]["location"],
            "date_submitted": c["created_at"],
            "status": c["status"]
        })
    activities.sort(key=lambda x: x["date_submitted"], reverse=True)
    return activities