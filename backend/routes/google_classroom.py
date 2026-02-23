"""
Google Classroom Integration Routes
Handles OAuth and Google Classroom API operations
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import secrets
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/google-classroom", tags=["google-classroom"])

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLASSROOM_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLASSROOM_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_CLASSROOM_REDIRECT_URI', '')

# Google Classroom API Scopes
SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]

# Store for OAuth state (in production, use Redis or database)
oauth_states = {}


class GoogleClassroomCredentials(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_expiry: Optional[str] = None
    user_email: Optional[str] = None


class CreateAssignmentRequest(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = ""
    link_url: str
    link_title: Optional[str] = None


def init_google_classroom_routes(db, get_current_user):
    """Initialize routes with database and auth dependencies"""
    
    @router.get("/auth-url")
    async def get_google_auth_url(request: Request, current_user: dict = Depends(get_current_user)):
        """Generate Google OAuth authorization URL"""
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=500, 
                detail="Google Classroom integration not configured. Please set GOOGLE_CLASSROOM_CLIENT_ID in environment."
            )
        
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "user_id": current_user["user_id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Build authorization URL
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + "&".join(
            f"{k}={v}" for k, v in params.items()
        )
        
        return {"auth_url": auth_url, "state": state}
    
    
    @router.get("/callback")
    async def google_oauth_callback(code: str, state: str, request: Request):
        """Handle Google OAuth callback"""
        import httpx
        
        # Verify state
        if state not in oauth_states:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        state_data = oauth_states.pop(state)
        user_id = state_data["user_id"]
        
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise HTTPException(status_code=500, detail="Google Classroom not configured")
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
            
            tokens = token_response.json()
        
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)
        
        # Get user info from Google
        async with httpx.AsyncClient() as client:
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_info_response.json() if user_info_response.status_code == 200 else {}
        
        # Store credentials in database
        google_credentials = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expiry": datetime.now(timezone.utc).isoformat(),
            "expires_in": expires_in,
            "google_email": user_info.get("email"),
            "google_name": user_info.get("name"),
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"google_classroom": google_credentials}}
        )
        
        logger.info(f"Google Classroom connected for user {user_id}")
        
        # Redirect back to frontend
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/classes?google_connected=true")
    
    
    @router.get("/status")
    async def get_connection_status(current_user: dict = Depends(get_current_user)):
        """Check if user has connected Google Classroom"""
        user = await db.users.find_one({"user_id": current_user["user_id"]})
        
        if not user:
            return {"connected": False}
        
        google_data = user.get("google_classroom")
        if not google_data:
            return {"connected": False}
        
        return {
            "connected": True,
            "google_email": google_data.get("google_email"),
            "google_name": google_data.get("google_name"),
            "connected_at": google_data.get("connected_at")
        }
    
    
    @router.delete("/disconnect")
    async def disconnect_google_classroom(current_user: dict = Depends(get_current_user)):
        """Disconnect Google Classroom integration"""
        await db.users.update_one(
            {"user_id": current_user["user_id"]},
            {"$unset": {"google_classroom": ""}}
        )
        
        return {"message": "Google Classroom disconnected"}
    
    
    @router.get("/courses")
    async def get_google_courses(current_user: dict = Depends(get_current_user)):
        """Fetch courses from Google Classroom"""
        import httpx
        
        user = await db.users.find_one({"user_id": current_user["user_id"]})
        if not user or not user.get("google_classroom"):
            raise HTTPException(status_code=400, detail="Google Classroom not connected")
        
        access_token = user["google_classroom"].get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token available")
        
        # Fetch courses from Google Classroom API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://classroom.googleapis.com/v1/courses",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"teacherId": "me", "courseStates": "ACTIVE"}
            )
            
            if response.status_code == 401:
                # Token expired - need to refresh or reconnect
                raise HTTPException(
                    status_code=401, 
                    detail="Google token expired. Please reconnect Google Classroom."
                )
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch courses: {response.text}")
                raise HTTPException(status_code=400, detail="Failed to fetch courses")
            
            data = response.json()
        
        return {"courses": data.get("courses", [])}
    
    
    @router.get("/courses/{course_id}/students")
    async def get_course_students(course_id: str, current_user: dict = Depends(get_current_user)):
        """Fetch students from a Google Classroom course"""
        import httpx
        
        user = await db.users.find_one({"user_id": current_user["user_id"]})
        if not user or not user.get("google_classroom"):
            raise HTTPException(status_code=400, detail="Google Classroom not connected")
        
        access_token = user["google_classroom"].get("access_token")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://classroom.googleapis.com/v1/courses/{course_id}/students",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch students")
            
            data = response.json()
        
        return {"students": data.get("students", [])}
    
    
    @router.post("/courses/{course_id}/assignment")
    async def create_classroom_assignment(
        course_id: str, 
        request: CreateAssignmentRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Create an assignment in Google Classroom with a link (e.g., game link)"""
        import httpx
        
        user = await db.users.find_one({"user_id": current_user["user_id"]})
        if not user or not user.get("google_classroom"):
            raise HTTPException(status_code=400, detail="Google Classroom not connected")
        
        access_token = user["google_classroom"].get("access_token")
        
        # Build assignment payload
        assignment_data = {
            "title": request.title,
            "description": request.description or "",
            "workType": "ASSIGNMENT",
            "state": "PUBLISHED",
            "materials": [
                {
                    "link": {
                        "url": request.link_url,
                        "title": request.link_title or request.title
                    }
                }
            ]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://classroom.googleapis.com/v1/courses/{course_id}/courseWork",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=assignment_data
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401, 
                    detail="Google token expired. Please reconnect Google Classroom."
                )
            
            if response.status_code != 200:
                logger.error(f"Failed to create assignment: {response.text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to create assignment: {response.text}"
                )
            
            result = response.json()
        
        logger.info(f"Created Google Classroom assignment: {result.get('id')}")
        
        return {
            "message": "Assignment created successfully",
            "assignment_id": result.get("id"),
            "alternate_link": result.get("alternateLink")
        }
    
    return router


# Export router
google_classroom_router = router
