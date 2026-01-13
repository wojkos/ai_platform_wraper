AI Platform Wrapper - Implementation Checklist
Status Tracking Document
Last Updated: January 13, 2026

Quick Reference
Default Credentials: admin / admin
Wrapper Frontend: http://localhost:3000
Wrapper Backend: http://localhost:8080
Embedded Modules: Langflow (7860), Talk-to-Data (7000)

Phase 1: Backend Setup ✓/✗
 1.1 Create ai_platform_wraper/backend/ directory
 1.2 Add users.json with admin user credentials
 1.3 Add modules.json with Langflow + Talk-to-Data definitions
 1.4 Add requirements.txt (fastapi, uvicorn, httpx, python-jose, pydantic)
 1.5 Create main.py with FastAPI app initialization
 1.6 Add CORS middleware to allow frontend on port 3000
 1.7 Define Pydantic models (LoginRequest, Token, ModuleStatus)
 1.8 Implement auth functions (load users, create JWT, verify JWT)
 1.9 Implement health check function (HTTP GET with timeout)
 1.10 Add /auth/login endpoint
 1.11 Add /modules endpoint with health checks
 1.12 Add /health endpoint
 1.13 Create Dockerfile for backend
Phase 2: Frontend Setup ✓/✗
 2.1 Create ai_platform_wraper/frontend/ directory structure
 2.2 Add package.json (react, react-dom, vite)
 2.3 Add vite.config.js with port 3000
 2.4 Add tailwind.config.js with Langflow dark theme
 2.5 Add index.html entry point
 2.6 Create src/main.jsx React entry
 2.7 Create src/App.jsx with routing logic
 2.8 Create src/components/Login.jsx form component
 2.9 Create src/components/Layout.jsx with sidebar
 2.10 Create src/components/ModuleFrame.jsx iframe wrapper
 2.11 Add Tailwind CSS with dark theme variables
 2.12 Create Dockerfile for frontend
Phase 3: Docker Integration ✓/✗
 3.1 Add wrapper-backend service to root docker-compose.yml
 3.2 Add wrapper-frontend service to root docker-compose.yml
 3.3 Add test-dynamic-sql service (Talk-to-Data) to compose
 3.4 Configure all services on langflow-network
 3.5 Set service dependencies (wrapper depends on modules)
 3.6 Add health checks to all services
 3.7 Test docker-compose up full stack
Phase 4: Documentation ✓/✗
 4.1 Create ai_platform_wraper/README.md with quick start
 4.2 Add Mermaid architecture diagram to README
 4.3 Add port mapping table
 4.4 Add "How to add a module" instructions
 4.5 Create ai_platform_wraper/ARCHITECTURE.md design doc
 4.6 Document health check pattern
 4.7 Document auth flow and JWT handling
 4.8 Add troubleshooting section
Key Files Reference

ai_platform_wraper/├── backend/main.py          [Auth + module API]├── backend/users.json       [Credentials store]├── backend/modules.json     [Module registry]├── frontend/src/App.jsx     [Main UI logic]├── frontend/src/components/Login.jsx├── frontend/src/components/Layout.jsx└── README.md                [Getting started]
Testing Checklist
 Backend health: curl http://localhost:8080/health
 Login with admin/admin
 Module list shows health status
 Click Langflow → iframe loads
 Click Talk-to-Data → iframe loads
 Refresh page → stays authenticated
 Invalid credentials rejected
