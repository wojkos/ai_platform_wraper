# Architecture Documentation

## AI Platform Wrapper - Design Decisions & Patterns

This document explains the architectural thinking behind the AI Platform Wrapper MVP.

## Design Philosophy

### Core Principles

1. **Separation of Concerns** - Wrapper provides infrastructure (auth, navigation), modules provide functionality
2. **Independence** - Each module can be developed, deployed, and scaled separately
3. **Extensibility** - Adding new modules requires only configuration changes
4. **Simplicity** - Lean MVP focused on demonstration, not production complexity

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP (Port 3000)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Wrapper Frontend (React)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Login     │  │   Sidebar    │  │  iframe      │      │
│  │  Component   │  │  Navigation  │  │  Container   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API (Port 8080)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Wrapper Backend (FastAPI)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Module     │  │   Health     │      │
│  │   Service    │  │   Registry   │  │    Checks    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         ▼                  ▼                   ▼             │
│   users.json        modules.json         HTTP Client        │
└─────────────────────────┬─────────────────────────────────┘
                          │ Health Check Requests
            ┌─────────────┴─────────────┐
            ▼                           ▼
  ┌──────────────────┐        ┌──────────────────┐
  │    Langflow      │        │  Talk-to-Data    │
  │   (Port 7860)    │        │   (Port 7000)    │
  │  [Independent]   │        │  [Independent]   │
  └──────────────────┘        └──────────────────┘
```

## Key Design Decisions

### 1. iframe-Based Module Embedding

**Decision**: Embed modules using iframes rather than reverse proxy or API aggregation.

**Rationale**:
- ✅ **Complete Isolation** - Modules can't interfere with each other
- ✅ **Independent Development** - Modules use their own frameworks, styles, state
- ✅ **No Integration Code** - Wrapper doesn't need to understand module internals
- ✅ **Simple Updates** - Module updates don't require wrapper changes
- ⚠️ **Limitation**: No cross-module data sharing (acceptable for MVP)

**Implementation**:
```jsx
<iframe
  src={module.url}
  sandbox="allow-same-origin allow-scripts allow-forms"
  title={module.name}
/>
```

### 2. File-Based Authentication

**Decision**: Store credentials in `users.json` with plain text passwords.

**Rationale**:
- ✅ **MVP Simplicity** - No database setup required
- ✅ **Demonstration Focus** - Shows auth flow without production complexity
- ✅ **Easy Setup** - Users can modify credentials directly
- ⚠️ **Not Production-Ready** - Intentional trade-off for MVP

**Future Production Path**:
- Hash passwords (bcrypt)
- Use proper user database
- Add password reset, 2FA
- Implement refresh tokens

### 3. Health Check Pattern

**Decision**: Backend actively checks module health before returning module list.

**Rationale**:
- ✅ **Better UX** - Users see real-time availability
- ✅ **Prevents Errors** - Can disable unavailable modules
- ✅ **Monitoring Foundation** - Easy to extend to metrics/alerting
- ⚠️ **Slight Latency** - 5-second timeout per module

**Implementation**:
```python
async def check_module_health(module: Module) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{module.url}{module.healthEndpoint}")
            return response.status_code == 200
    except Exception:
        return False
```

### 4. Static Module Configuration

**Decision**: Define modules in `modules.json` rather than dynamic discovery.

**Rationale**:
- ✅ **Predictable** - Explicit control over what appears
- ✅ **Simple** - No service discovery infrastructure
- ✅ **Documented** - Configuration serves as documentation
- ⚠️ **Manual Process** - Adding modules requires editing file

**Configuration Schema**:
```json
{
  "id": "unique-identifier",
  "name": "Display Name",
  "description": "What it does",
  "url": "http://service:port",
  "healthEndpoint": "/health",
  "icon": "category-icon",
  "category": "builder|tools|analytics"
}
```

### 5. No Auth Propagation to Modules

**Decision**: Wrapper authenticates users, but doesn't pass credentials to modules.

**Rationale**:
- ✅ **Trusted Local Environment** - MVP assumption
- ✅ **Reduces Complexity** - No token passing mechanism needed
- ✅ **Module Independence** - Modules don't need auth integration
- ⚠️ **Security Gap** - Modules accessible directly by port

**Future Production Path**:
- Pass JWT as URL parameter: `?token=...`
- Module validates token with wrapper backend
- Implement proper session management

### 6. Docker Compose for Orchestration

**Decision**: Use Docker Compose rather than Kubernetes or cloud services.

**Rationale**:
- ✅ **Local Development** - Easy setup for demos
- ✅ **Portable** - Works on any Docker-capable machine
- ✅ **Simple** - Single command to start everything
- ✅ **Cost-Free** - No cloud infrastructure needed
- ⚠️ **Not Scalable** - Not suitable for production load

### 7. Synchronous REST Communication

**Decision**: Use simple HTTP REST rather than message queues or GraphQL.

**Rationale**:
- ✅ **Straightforward** - Easy to understand and debug
- ✅ **HTTP Native** - Works with any HTTP client
- ✅ **No Infrastructure** - No RabbitMQ, Kafka, etc.
- ⚠️ **Limited Patterns** - No pub/sub, streaming, or complex queries

## Data Flow Patterns

### Authentication Flow

```
1. User enters credentials
   ├─> Frontend: POST /auth/login {username, password}
   └─> Backend: Load users.json
       ├─> Find matching user
       ├─> Create JWT token (exp: 60min)
       └─> Return {access_token, token_type}

2. Frontend stores token
   └─> localStorage.setItem('token', token)

3. All subsequent requests include token
   └─> Authorization: Bearer <token>
```

### Module Loading Flow

```
1. User logs in successfully
   └─> Frontend: GET /modules (with JWT)

2. Backend processes request
   ├─> Verify JWT token
   ├─> Load modules.json
   └─> For each module:
       ├─> HTTP GET module.url + module.healthEndpoint
       ├─> Record availability (true/false)
       └─> Return module + availability status

3. Frontend displays modules
   ├─> Available modules: Green indicator, clickable
   └─> Unavailable modules: Red indicator, disabled
```

### Module Navigation Flow

```
1. User clicks module in sidebar
   └─> Frontend: setSelectedModule(module)

2. Frontend updates iframe
   └─> <iframe src={module.url} />

3. Module loads independently
   ├─> Module handles its own routing
   ├─> Module manages its own state
   └─> No communication with wrapper
```

## Technology Choices

### Backend: Python + FastAPI

**Why FastAPI**:
- Modern async support (health checks run in parallel)
- Automatic OpenAPI documentation
- Fast performance (comparable to Node.js)
- Excellent developer experience
- Type hints with Pydantic

**Alternatives Considered**:
- Express.js: Good, but team has Python expertise
- Django: Too heavy for simple API gateway
- Flask: Lacks async, OpenAPI generation

### Frontend: React + Vite

**Why React + Vite**:
- Langflow uses React (visual consistency)
- Vite provides fast dev experience
- Large ecosystem of components
- Familiar to most developers

**Why Not**:
- Vue.js: Less common in AI tooling space
- Angular: Heavier framework than needed
- Svelte: Smaller ecosystem

### Styling: Tailwind CSS

**Why Tailwind**:
- Langflow uses Tailwind (easy to match styles)
- Utility-first approach (fast prototyping)
- Dark mode built-in
- No CSS bundle size issues

### Auth: JWT (JSON Web Tokens)

**Why JWT**:
- Stateless (no session storage needed)
- Self-contained (includes user claims)
- Standard (many libraries available)
- Easy to verify

## Security Model (MVP)

### Current Security Posture

| Aspect | MVP Implementation | Production Need |
|--------|-------------------|-----------------|
| **Password Storage** | Plain text in JSON | Bcrypt/Argon2 hashing |
| **Transport** | HTTP | HTTPS with TLS 1.3 |
| **Token Expiry** | 60 minutes | 15 min access + refresh token |
| **CORS** | Wide open | Specific origins only |
| **Rate Limiting** | None | Per-IP rate limits |
| **Input Validation** | Basic Pydantic | Full sanitization |
| **Module Access** | Direct port access | Behind API gateway |

### Threat Model

**Trusted Environment Assumptions**:
- Local deployment only
- Trusted network
- Trusted users
- No public internet exposure

**Known Vulnerabilities** (Acceptable for MVP):
1. No password encryption
2. Modules accessible by port
3. No audit logging
4. No rate limiting
5. Wide CORS policy

## Extensibility Patterns

### Adding a New Module (Step-by-Step)

1. **Module Requirements**:
   - Must expose `/health` endpoint
   - Must allow iframe embedding (no X-Frame-Options: DENY)
   - Should run on unique port

2. **Docker Setup**:
   ```yaml
   my-module:
     build: ./path/to/module
     ports:
       - "PORT:PORT"
     networks:
       - langflow-network
     healthcheck:
       test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
   ```

3. **Register Module**:
   ```json
   // backend/modules.json
   {
     "id": "my-module",
     "name": "My Module",
     "url": "http://my-module:PORT",
     "healthEndpoint": "/health"
   }
   ```

4. **Restart**:
   ```bash
   docker-compose restart wrapper-backend
   ```

### Future Enhancements (Post-MVP)

1. **Dynamic Module Discovery**
   - Service registry (Consul, etcd)
   - Auto-detect new modules
   - Hot reload configuration

2. **Cross-Module Communication**
   - Event bus (Redis pub/sub)
   - Shared data layer
   - Webhook notifications

3. **Advanced Auth**
   - SSO/SAML integration
   - Role-based access control (RBAC)
   - Module-level permissions
   - API key management

4. **Monitoring & Observability**
   - Prometheus metrics
   - Grafana dashboards
   - Distributed tracing (Jaeger)
   - Centralized logging (ELK stack)

## Performance Considerations

### Current Performance Profile

| Operation | Latency | Notes |
|-----------|---------|-------|
| Login | ~50ms | File read + JWT creation |
| Module List | ~5s max | Health checks in parallel |
| Module Load | Depends | iframe loads module directly |
| Token Verify | ~1ms | JWT decode only |

### Optimization Opportunities

1. **Cache Module Health**:
   - Don't check on every request
   - Background polling (every 30s)
   - Broadcast updates via WebSocket

2. **Parallel Health Checks**:
   - Already implemented with `async`
   - Could add retry logic

3. **Frontend Optimization**:
   - Code splitting by route
   - Lazy load components
   - Service worker for offline

## Deployment Scenarios

### Current: Local Development

```
docker-compose up
```

**Pros**: Simple, fast, reproducible
**Cons**: Not scalable, single machine

### Future: Cloud Deployment

**Option 1: Cloud VM + Docker Compose**
- Deploy to AWS EC2 / Azure VM / GCP Compute
- Same docker-compose.yml
- Add HTTPS reverse proxy (Caddy/Traefik)

**Option 2: Container Orchestration**
- Kubernetes (overkill for MVP)
- AWS ECS / Azure Container Instances
- Auto-scaling, load balancing

**Option 3: Serverless**
- Backend → AWS Lambda / Azure Functions
- Frontend → S3 + CloudFront
- Modules → Container instances

## Testing Strategy

### MVP Testing (Manual)

1. **Smoke Tests**:
   - ✓ Can login with admin/admin
   - ✓ Modules show correct status
   - ✓ iframe loads module content
   - ✓ Logout clears session

2. **Error Cases**:
   - ✓ Wrong credentials rejected
   - ✓ Expired token redirects to login
   - ✓ Unavailable module shows error

### Future Testing Layers

1. **Unit Tests**:
   - Backend: pytest for API endpoints
   - Frontend: Vitest + React Testing Library

2. **Integration Tests**:
   - Docker Compose + testcontainers
   - End-to-end health check flow

3. **E2E Tests**:
   - Playwright / Cypress
   - Full user journey automation

## Conclusion

This architecture prioritizes **simplicity, extensibility, and demonstration value** over production-grade features. It successfully shows:

- ✅ Clean separation between wrapper and modules
- ✅ Easy addition of new modules
- ✅ Scalable organizational pattern
- ✅ Modern tech stack
- ✅ Practical MVP thinking

The design provides a **clear path to production** while remaining simple enough to understand in a demo context.
