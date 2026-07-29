from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from typing import List

security = OAuth2PasswordBearer(tokenUrl="/api/login")

SECRET_KEY = "super_secret_key_change_in_production"
ALGORITHM = "HS256"

ALL_DOMAINS = ["HR", "IT"]

def get_current_user_context(token: str = Depends(security)) -> dict:
    """
    Task 3 & 4 combined security function.
    Intercepts the token, reads user identity/roles, and calculates domain bounds.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        allowed_domains_str = payload.get("allowed_domains", "")
        username = payload.get("sub")
        session_id = payload.get("session_id")
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security token or signature failed authentication."
        )
    
    if role == "Admin":
        return {"username": username, "domains": ALL_DOMAINS, "session_id": session_id, "role": role}
    elif role in ["HR", "IT"]:
        user_domains = [d.strip() for d in allowed_domains_str.split(",") if d.strip()]
        final_domains = [d for d in user_domains if d == role]
        return {"username": username, "domains": final_domains, "session_id": session_id, "role": role}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Your assigned role does not belong to an approved domain namespace."
        )
