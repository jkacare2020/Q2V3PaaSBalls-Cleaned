import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# ✅ Define the database URL before using it
SQLALCHEMY_DATABASE_URL = "sqlite:///./todosapp.db"

print(f"📂 Using database: {os.path.abspath(SQLALCHEMY_DATABASE_URL[10:])}")


SQLALCHEMY_DATABASE_URL = 'sqlite:///./todosapp.db'

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
