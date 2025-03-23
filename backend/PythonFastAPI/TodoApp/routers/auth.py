from datetime import timedelta, datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
from ..database import SessionLocal
from ..models import Users
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
import os

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

SECRET_KEY = os.getenv("SECRET_KEY", "197b2c37c391bed93fe80344fe73b806947a65e36206e05a1a23c2fa12702fe3")
ALGORITHM = 'HS256'

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='/auth/token')

class CreateUserRequest(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    role: str
    phone_number: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

def authenticate_user(username: str, password: str, db):
    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(username: str, user_id: int, role: str, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id, 'role': role}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})

    print(f"🔑 Creating JWT with Payload: {encode}")  # ✅ Debugging Token Generation
    token = jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"✅ Encoded JWT: {token}")  # ✅ Print token for verification

    return token

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        print(f"🔍 Received Token: {token}")  # Debugging
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Decoded Token Payload: {payload}")  # Debugging

        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        user_role: str = payload.get('role')

        if username is None or user_id is None:
            print("❌ User ID is missing in token payload!")  # Debugging
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')

        return {'username': username, 'id': user_id, 'user_role': user_role}

    except JWTError as e:
        print(f"❌ JWT Decoding Error: {str(e)}")  # Debugging
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='Could not validate user.')



@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency,
                      create_user_request: CreateUserRequest):
    create_user_model = Users(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        role=create_user_request.role,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        is_active=True,
        phone_number=create_user_request.phone_number
    )

    db.add(create_user_model)
    db.commit()
    return {"message": "User created successfully!"}


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='Could not validate user.')
    token = create_access_token(user.username, user.id, user.role, timedelta(minutes=200))

    return {'access_token': token, 'token_type': 'bearer', "user_id":user.id}

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    print(f"🔹 Received Token: {token}")  # Debugging

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"🔹 Decoded Payload: {payload}")  # Debugging

        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        user_role: str = payload.get('role')

        if username is None or user_id is None:
            print("🔸 User validation failed: Missing username or ID")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user.')

        return {'username': username, 'id': user_id, 'user_role': user_role}

    except JWTError as e:
        print(f"🔴 JWT Error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user.')
#----------------------------------------------------------------------
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Logs out the user by instructing the frontend to remove the token.
    """
    return {"message": "Logout successful! Please remove token from storage."}







