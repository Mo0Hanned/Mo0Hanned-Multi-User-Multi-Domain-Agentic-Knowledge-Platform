from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.repository import UserRepository
from src.api.schemas import UserCreate
from src.api.auth import hash_password, verify_password, create_access_token
from src.database.models import User as PostgresUser

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    async def register_user(self, db: Session, pg_db: AsyncSession, user_in: UserCreate):
        """Handle user registration logic."""
        existing_user = self.user_repo.get_user_by_username(db, user_in.username)
        if existing_user:
            return None  # Indicates the username is already taken
            
        # Automatically assign all domains if the user is an Admin
        final_domains = "HR,IT" if user_in.system_role == "Admin" else user_in.allowed_domains

        user_data = {
            "username": user_in.username,
            "full_name": user_in.full_name,
            "hashed_password": hash_password(user_in.password),
            "role": user_in.system_role,
            "allowed_domains": final_domains
        }
        
        # Create user in SQLite
        sqlite_user = self.user_repo.create_user(db, user_data)
        
        # Create user in Postgres
        email = f"{user_in.full_name.strip().lower().replace(' ', '.')}@company.com"
        pg_user = PostgresUser(
            full_name=user_in.full_name,
            email=email,
            role=user_in.job_role
        )
        pg_db.add(pg_user)
        try:
            await pg_db.commit()
        except Exception:
            # If postgres fails, rollback sqlite user to prevent inconsistency
            db.delete(sqlite_user)
            db.commit()
            raise
            
        return sqlite_user

    def authenticate_user(self, db: Session, username: str, password: str):
        """Handle user authentication and token generation."""
        user = self.user_repo.get_user_by_username(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        
        token_data = {"sub": user.username, "role": user.role, "allowed_domains": user.allowed_domains or ""}
        token = create_access_token(data=token_data)
        return token
