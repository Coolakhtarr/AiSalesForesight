import jwt
from fastapi import Header, HTTPException, status

from app.core.config import get_settings, get_supabase


class AuthContext:
    def __init__(self, user_id: str, org_id: str):
        self.user_id = user_id
        self.org_id = org_id


def get_current_org(authorization: str = Header(...)) -> AuthContext:
    """
    Verifies the Supabase-issued JWT and resolves the caller's org_id via
    the memberships table. Raises 401 on any failure.
    """
    settings = get_settings()
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing sub")

    supabase = get_supabase()
    result = (
        supabase.table("memberships")
        .select("org_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "User has no organization")

    org_id = result.data[0]["org_id"]
    return AuthContext(user_id=user_id, org_id=org_id)
