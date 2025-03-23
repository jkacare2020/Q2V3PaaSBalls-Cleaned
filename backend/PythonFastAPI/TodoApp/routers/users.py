from typing import Annotated
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from ..models import Users
from ..database import SessionLocal
from .auth import get_current_user
from passlib.context import CryptContext

router = APIRouter(
    prefix='/user',
    tags=['user']
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


class UserVerification(BaseModel):
    password: str
    new_password: str = Field(min_length=6)


@router.get("/userMe", status_code=status.HTTP_200_OK)
async def get_user(user: user_dependency, db: db_dependency):
    """Retrieve the logged-in user's profile (User can only see themselves)."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")

    user_data = db.query(Users).filter(Users.id == user.get("id")).first()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Exclude hashed password before returning user info
    return {
        "id": user_data.id,
        "username": user_data.username,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "is_active": user_data.is_active,
        "phone_number": user_data.phone_number
    }



@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(user: user_dependency, db: db_dependency,
                          user_verification: UserVerification):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    user_model = db.query(Users).filter(Users.id == user.get('id')).first()

    if not bcrypt_context.verify(user_verification.password, user_model.hashed_password):
        raise HTTPException(status_code=401, detail='Error on password change')
    user_model.hashed_password = bcrypt_context.hash(user_verification.new_password)
    db.add(user_model)
    db.commit()


@router.put("/phonenumber/{phone_number}", status_code=status.HTTP_204_NO_CONTENT)
async def change_phonenumber(user: user_dependency, db: db_dependency,
                          phone_number: str):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    user_model = db.query(Users).filter(Users.id == user.get('id')).first()
    user_model.phone_number = phone_number
    db.add(user_model)
    db.commit()
    
@router.get("/all", status_code=status.HTTP_200_OK)
async def get_all_users(user: user_dependency, db: db_dependency):
    """Retrieve all users (Admin only)"""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")

    print(f"🔹 Authenticated User: {user}")  # ✅ Debugging

    if user.get("user_role") != "admin":  # ✅ Ensure using 'user_role'
        raise HTTPException(status_code=403, detail="Unauthorized Access")

    users = db.query(Users).all()
    return users









