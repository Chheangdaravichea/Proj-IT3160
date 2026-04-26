from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.auth import router as auth_router
from .api.path import router as path_router
from .api.scenarios import router as scenarios_router

app = FastAPI(title="Nagoya A* Live Demo", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(path_router, prefix="/api")
app.include_router(scenarios_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Nagoya A* Live Demo API is running",
        "tips": [
            "Open /docs to test the API.",
            "Open frontend/index.html for the user page.",
            "Open frontend/login.html to login first.",
            "Demo accounts: user/user123 and admin/admin123.",
        ],
    }
