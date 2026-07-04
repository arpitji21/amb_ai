"""
database.py

Centralized SQLAlchemy database configuration.

Supports:
- SQLite (development)
- PostgreSQL (Render / Railway / Supabase / Production)
- Automatic connection pooling
- Environment-based configuration
- Session management
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------
# Load Environment Variables
# ---------------------------------------------------------

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./leip.db"

# ---------------------------------------------------------
# SQLite Configuration
# ---------------------------------------------------------

is_sqlite = DATABASE_URL.startswith("sqlite")

engine_args = {}

if is_sqlite:
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    # Production database settings
    engine_args.update(
        {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_size": 10,
            "max_overflow": 20,
            "future": True,
        }
    )

# ---------------------------------------------------------
# SQLAlchemy Engine
# ---------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    **engine_args,
)

# ---------------------------------------------------------
# Session Factory
# ---------------------------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

# ---------------------------------------------------------
# Base Model
# ---------------------------------------------------------

Base = declarative_base()

# ---------------------------------------------------------
# Dependency
# ---------------------------------------------------------


def get_db():
    """
    FastAPI Dependency.

    Example:

    @router.get("/patients")
    def list_patients(db: Session = Depends(get_db)):
        ...
    """
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ---------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------


def create_tables():
    """
    Create all database tables.
    """
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """
    Drop all database tables.
    WARNING:
    Use only during development/testing.
    """
    Base.metadata.drop_all(bind=engine)