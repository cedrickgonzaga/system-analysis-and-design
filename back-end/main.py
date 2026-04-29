import sys
import os

# Add the back-end directory to the Python path so Vercel can find the 'app' module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.routers import tickets, items, claims, admins

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # open for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets.router)
app.include_router(items.router)
app.include_router(claims.router)
app.include_router(admins.router)

@app.get("/")
def root():
    return {"message": "FindFix API is running"}