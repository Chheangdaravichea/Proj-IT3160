from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Dict, Optional

from fastapi import Header, HTTPException, status


@dataclass(frozen=True)
class CurrentUser:
    username: str
    role: str
    display_name: str


class AuthService:
    """Small in-memory auth service for class demo purposes.

    Demo accounts are intentionally simple and documented in README.
    Tokens are stored in memory, so they reset when the backend restarts.
    """

    def __init__(self) -> None:
        self.users: Dict[str, Dict[str, str]] = {
            "admin": {
                "password": "admin123",
                "role": "admin",
                "display_name": "Administrator",
            },
            "user": {
                "password": "user123",
                "role": "user",
                "display_name": "Normal User",
            },
        }
        self.tokens: Dict[str, CurrentUser] = {}

    def login(self, username: str, password: str) -> Optional[tuple[str, CurrentUser]]:
        account = self.users.get(username)
        if not account or account["password"] != password:
            return None
        token = secrets.token_urlsafe(32)
        user = CurrentUser(
            username=username,
            role=account["role"],
            display_name=account["display_name"],
        )
        self.tokens[token] = user
        return token, user

    def get_user_by_token(self, token: str) -> Optional[CurrentUser]:
        return self.tokens.get(token)

    def logout(self, token: str) -> None:
        self.tokens.pop(token, None)


auth_service = AuthService()


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization token",
        )
    return authorization.split(" ", 1)[1].strip()


def require_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    token = _extract_bearer_token(authorization)
    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login session expired. Please login again.",
        )
    return user


def require_admin(authorization: str | None = Header(default=None)) -> CurrentUser:
    user = require_user(authorization)
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role is required for this action",
        )
    return user
