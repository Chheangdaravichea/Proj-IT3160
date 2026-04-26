from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from ..services.auth import CurrentUser, auth_service, require_user

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
def login(payload: LoginRequest):
    result = auth_service.login(payload.username.strip(), payload.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong username or password",
        )
    token, user = result
    return {
        "token": token,
        "user": {
            "username": user.username,
            "role": user.role,
            "display_name": user.display_name,
        },
    }


@router.get("/auth/me")
def me(current_user: CurrentUser = Depends(require_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "display_name": current_user.display_name,
    }


@router.post("/auth/logout")
def logout(authorization: str | None = Header(default=None)):
    if authorization and authorization.lower().startswith("bearer "):
        auth_service.logout(authorization.split(" ", 1)[1].strip())
    return {"message": "Logged out"}
