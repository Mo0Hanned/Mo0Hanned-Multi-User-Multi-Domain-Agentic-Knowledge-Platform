from sqlalchemy.orm import Session
from src.api.database import User

class UserRepository:
    def get_user_by_username(self, db: Session, username: str) -> User | None:
        """Fetch a user by their username."""
        return db.query(User).filter(User.username == username).first()

    def create_user(self, db: Session, user_data: dict) -> User:
        """Create and save a new user."""
        new_user = User(**user_data)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
