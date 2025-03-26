import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Priority: PostgreSQL (Render) > SQLite (Local)
SQLALCHEMY_DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("INTERNAL_DATABASE_URL")
    or "sqlite:///./todosapp.db"
)

print(f"📦 Using database: {SQLALCHEMY_DATABASE_URL}")

# Special connect_args only for SQLite
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


