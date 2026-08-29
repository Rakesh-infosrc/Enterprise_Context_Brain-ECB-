from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from ..infrastructure.db.store import CanonicalStore, SessionLocal
from ..infrastructure.db.models import DBUser

SECRET_KEY = "your-super-secret-key-for-dev"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/token", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    api_key: Optional[str] = Depends(api_key_header),
):
    if api_key:
        with SessionLocal() as db:
            user = db.query(DBUser).filter(DBUser.api_key == api_key).first()
            if user:
                return user
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key"
            )

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email:
                with SessionLocal() as db:
                    user = db.query(DBUser).filter(DBUser.email == email).first()
                    if user:
                        return user
        except JWTError:
            pass

    # Default dev/test user fallback
    with SessionLocal() as db:
        user = db.query(DBUser).filter(DBUser.email == "sarah.jenkins@acmefin.com").first()
        if user:
            return user
        return DBUser(id="usr-sarah-jenkins", name="Sarah Jenkins", email="sarah.jenkins@acmefin.com", role="project_manager", org_id="org-acme-fintech")
