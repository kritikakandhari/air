from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..security import hash_password, verify_password, create_token, current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_dict(u: models.User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "avatar_url": u.avatar_url,
            "is_host": u.is_host, "is_superhost": u.is_superhost}


@router.post("/signup", status_code=201)
def signup(body: schemas.SignupIn, db: Session = Depends(get_db)):
    if db.scalar(select(models.User).where(models.User.email == body.email)):
        raise HTTPException(409, "An account with this email already exists")
    user = models.User(name=body.name.strip(), email=body.email, password_hash=hash_password(body.password),
                       avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={body.name.strip()}")
    db.add(user); db.commit(); db.refresh(user)
    return {"token": create_token(user.id), "user": user_dict(user)}


@router.post("/login")
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(models.User).where(models.User.email == body.email.strip().lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"token": create_token(user.id), "user": user_dict(user)}


@router.get("/me")
def me(user: models.User = Depends(current_user)):
    return user_dict(user)


@router.post("/become-host")
def become_host(user: models.User = Depends(current_user), db: Session = Depends(get_db)):
    user.is_host = True
    db.commit()
    return user_dict(user)
