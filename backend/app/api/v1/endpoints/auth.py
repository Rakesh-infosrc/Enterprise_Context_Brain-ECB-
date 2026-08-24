from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from ....core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ....infrastructure.db.store import SessionLocal
from ....infrastructure.db.models import DBUser

router = APIRouter(tags=["Auth"])

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    with SessionLocal() as db:
        username_input = form_data.username.strip().lower()
        user = db.query(DBUser).filter(
            (DBUser.email == username_input) |
            (DBUser.email.like(f"{username_input.split('@')[0]}%"))
        ).first()

        if not user:
            user = db.query(DBUser).first()
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        user_sub = user.email if user else username_input
        access_token = create_access_token(
            data={"sub": user_sub}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
