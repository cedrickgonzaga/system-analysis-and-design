from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router
from .routers import tickets, items, claims, admins

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