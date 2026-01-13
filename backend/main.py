"""
AI Platform Wrapper - Backend API
Provides authentication and module configuration for the wrapper frontend.
"""
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional

import httpx
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Paths
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
MODULES_FILE = os.path.join(os.path.dirname(__file__), "modules.json")

# Initialize FastAPI
app = FastAPI(
    title="AI Platform Wrapper API",
    description="Backend API for AI Platform Wrapper MVP",
    version="1.0.0"
)

# CORS middleware - allow frontend on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://wrapper-frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class User(BaseModel):
    username: str
    email: str
    role: str


class Module(BaseModel):
    id: str
    name: str
    description: str
    url: str
    healthEndpoint: str
    icon: str
    category: str


class ModuleStatus(BaseModel):
    id: str
    name: str
    description: str
    url: str
    icon: str
    category: str
    available: bool
    healthEndpoint: str


# Helper Functions
def load_users() -> List[dict]:
    """Load users from users.json file"""
    with open(USERS_FILE, 'r') as f:
        return json.load(f)


def load_modules() -> List[Module]:
    """Load modules from modules.json file"""
    with open(MODULES_FILE, 'r') as f:
        data = json.load(f)
        return [Module(**module) for module in data["modules"]]


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token from Authorization header"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


async def check_module_health(module: Module) -> bool:
    """Check if a module is available by hitting its health endpoint"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{module.url}{module.healthEndpoint}")
            return response.status_code == 200
    except Exception:
        return False


# API Endpoints
@app.post("/auth/login", response_model=Token)
async def login(login_request: LoginRequest):
    """Authenticate user and return JWT token"""
    users = load_users()
    
    # Find user by username and password (plain text for MVP)
    user = next(
        (u for u in users if u["username"] == login_request.username and u["password"] == login_request.password),
        None
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/modules", response_model=List[ModuleStatus])
async def get_modules(payload: dict = Depends(verify_token)):
    """Get list of available modules with health status"""
    modules = load_modules()
    module_statuses = []
    
    for module in modules:
        available = await check_module_health(module)
        module_statuses.append(
            ModuleStatus(
                id=module.id,
                name=module.name,
                description=module.description,
                url=module.url,
                icon=module.icon,
                category=module.category,
                available=available,
                healthEndpoint=module.healthEndpoint
            )
        )
    
    return module_statuses


@app.get("/health")
async def health_check():
    """Health check endpoint for wrapper backend"""
    return {
        "status": "healthy",
        "service": "ai-platform-wrapper-backend",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
