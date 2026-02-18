"""Authentication routes"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from datetime import datetime, timezone, timedelta
import httpx
import os
import logging

from utils.database import db
from utils.auth import (
    get_current_user, create_jwt_token, hash_password, verify_password,
    generate_user_id, JWT_EXPIRATION_DAYS
)
from models import UserCreate, UserLogin, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, response: Response):
    """Register a new user with email/password"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_user_id()
    now = datetime.now(timezone.utc).isoformat()
    
    # Create a UNIQUE school for each new user (not shared default)
    school_id = user_data.school_id
    if not school_id:
        # Generate unique school ID for this user
        school_id = f"school_{user_id.replace('user_', '')}"
        await db.schools.insert_one({
            "school_id": school_id,
            "name": "My School",  # Generic name - user will customize
            "address": "",
            "phone": "",
            "email": "",
            "logo_url": "",
            "created_at": now,
            "owner_user_id": user_id  # Track who owns this school
        })
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "school_id": school_id,
        "language": user_data.language,
        "picture": None,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    token = create_jwt_token(user_id)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return UserResponse(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        school_id=school_id,
        language=user_data.language,
        created_at=now
    )


@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"])
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "teacher"),
        school_id=user.get("school_id"),
        picture=user.get("picture"),
        language=user.get("language", "es"),
        created_at=user.get("created_at")
    )


@router.post("/session")
async def process_google_session(request: Request, response: Response):
    """Process Google OAuth session_id and create local session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    emergent_auth_url = os.environ.get('EMERGENT_AUTH_URL', 'https://demobackend.emergentagent.com')
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                f"{emergent_auth_url}/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
        school_id = existing_user.get("school_id", "school_default")
        role = existing_user.get("role", "teacher")
        language = existing_user.get("language", "es")
    else:
        user_id = generate_user_id()
        school_id = "school_default"
        role = "teacher"
        language = "es"
        
        # Create default school if needed
        existing_school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
        if not existing_school:
            await db.schools.insert_one({
                "school_id": school_id,
                "name": "Default School",
                "created_at": now
            })
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "school_id": school_id,
            "language": language,
            "created_at": now
        })
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
        "school_id": school_id,
        "language": language
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "teacher"),
        school_id=user.get("school_id"),
        picture=user.get("picture"),
        language=user.get("language", "es"),
        created_at=user.get("created_at")
    )


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


@router.put("/profile", response_model=UserResponse)
async def update_profile(request: Request, user: dict = Depends(get_current_user)):
    """Update user profile"""
    body = await request.json()
    update_fields = {}
    
    if "name" in body:
        update_fields["name"] = body["name"]
    if "language" in body:
        update_fields["language"] = body["language"]
    
    if update_fields:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return UserResponse(**updated_user)
