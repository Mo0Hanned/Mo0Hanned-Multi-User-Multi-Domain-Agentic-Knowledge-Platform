import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from src.database.connection import Base

# --- Enums for strict data validation ---
class LeaveType(str, enum.Enum):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    MATERNITY = "MATERNITY"
    UNPAID = "UNPAID"

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# --- Models ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    leave_balances = relationship("HRLeaveBalance", back_populates="user", cascade="all, delete-orphan")
    it_tickets = relationship("ITTicket", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(full_name='{self.full_name}', role='{self.role}')>"


class HRLeaveBalance(Base):
    """Domain: HR - Tracks available leave days for users."""
    __tablename__ = "hr_leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(Enum(LeaveType, native_enum=False, length=50), nullable=False)
    available_days = Column(Integer, nullable=False, default=0)
    used_days = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="leave_balances")

    def __repr__(self):
        return f"<HRLeaveBalance(user_id={self.user_id}, type='{self.leave_type}', available={self.available_days})>"


class ITTicket(Base):
    """Domain: IT - Tracks support tickets like laptop requests or software issues."""
    __tablename__ = "it_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TicketStatus, native_enum=False, length=50), default=TicketStatus.OPEN, nullable=False)
    priority = Column(Enum(TicketPriority, native_enum=False, length=50), default=TicketPriority.MEDIUM, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationship
    user = relationship("User", back_populates="it_tickets")

    def __repr__(self):
        return f"<ITTicket(id={self.id}, status='{self.status}', priority='{self.priority}')>"