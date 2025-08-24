# 🏗️ System Architecture

> **Price Optimization Tool - Technical Architecture Documentation**

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [API Design](#api-design)
6. [Security Architecture](#security-architecture)
7. [Data Flow](#data-flow)
8. [Deployment Architecture](#deployment-architecture)
9. [Scalability Considerations](#scalability-considerations)

## 🌐 System Overview

The Price Optimization Tool follows a **modern three-tier architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │    │     Logic       │    │     Layer       │
│                 │    │     Layer       │    │                 │
│  React Frontend │◄──►│ Django REST API │◄──►│ SQLite/PostgreSQL│
│   (Port 3000)   │    │   (Port 8000)   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

- **Frontend (React SPA)**: User interface and experience layer
- **Backend (Django REST API)**: Business logic and data processing
- **Database (SQLite/PostgreSQL)**: Data persistence and storage
- **Authentication (JWT)**: Secure user authentication system

## 🎯 Architecture Patterns

### 1. **Model-View-Controller (MVC)**
```
Django Backend:
├── Models (Data Layer)
├── Views (Controller Layer)  
└── Templates (Not used - API only)

React Frontend:
├── Components (View Layer)
├── Context/Hooks (Controller)
└── API Layer (Data Interface)
```

### 2. **Repository Pattern**
- **Django ORM**: Acts as repository layer
- **API Services**: Abstraction over HTTP calls
- **Clean separation**: Business logic from data access

### 3. **Role-Based Access Control (RBAC)**
```
User → Role → Permissions → Resources
```

## 🛠️ Technology Stack

### Backend Stack
```
┌─────────────────────────────────────────┐
│           Django Framework              │
├─────────────────────────────────────────┤
│  Django REST Framework (API Layer)     │
├─────────────────────────────────────────┤
│  JWT Authentication (Security)         │
├─────────────────────────────────────────┤
│  SQLite/PostgreSQL (Data Layer)        │
└─────────────────────────────────────────┘
```

### Frontend Stack
```
┌─────────────────────────────────────────┐
│         React 18 (UI Framework)        │
├─────────────────────────────────────────┤
│      Material-UI (Component Library)   │
├─────────────────────────────────────────┤
│     React Router (Client Routing)      │
├─────────────────────────────────────────┤
│      Recharts (Data Visualization)     │
├─────────────────────────────────────────┤
│         Axios (HTTP Client)            │
└─────────────────────────────────────────┘
```

## 🗄️ Database Architecture

### Entity Relationship Diagram
```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    User     │────▶│  UserProfile    │     │    Product      │
│             │     │                 │     │                 │
│ • id        │     │ • user_id       │◄────│ • owner_id      │
│ • username  │     │ • role          │     │ • name          │
│ • email     │     │ • created_at    │     │ • category      │
│ • is_active │     └─────────────────┘     │ • base_price    │
└─────────────┘                             │ • current_price │
                                            │ • optimized_price│
                                            │ • stock_qty     │
                                            │ • units_sold    │
                                            └─────────────────┘
                                                     │
                                            ┌─────────────────┐
                                            │PriceHistory     │
                                            │                 │
                                            │ • product_id    │
                                            │ • old_price     │
                                            │ • new_price     │
                                            │ • changed_by    │
                                            │ • changed_at    │
                                            └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│SupplierRequest  │     │ DemandForecast  │
│                 │     │                 │
│ • user_id       │     │ • product_id    │
│ • company       │     │ • forecast_data │
│ • reason        │     │ • method        │
│ • status        │     │ • confidence    │
│ • created_at    │     │ • created_at    │
└─────────────────┘     └─────────────────┘
```

### Key Database Design Decisions

1. **User-Product Relationship**: One-to-Many (User owns multiple Products)
2. **Role-Based Design**: Separate UserProfile for role management
3. **Audit Trail**: ProductPriceHistory for price change tracking
4. **Forecasting**: JSON field for flexible forecast data storage
5. **Indexing Strategy**: Optimized queries with database indexes

### Database Constraints
```sql
-- Key Constraints Implemented
ALTER TABLE products ADD CONSTRAINT fk_owner 
  FOREIGN KEY (owner_id) REFERENCES auth_user(id);

ALTER TABLE userprofile ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES auth_user(id);

-- Indexes for Performance
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
```

## 🔌 API Design

### RESTful Architecture
```
Base URL: http://localhost:8000/api/

Authentication:
├── POST   /auth/register/          # User registration
├── POST   /auth/login/             # User login
├── POST   /auth/logout/            # User logout
├── GET    /auth/me/                # User profile
└── POST   /auth/token/refresh/     # JWT refresh

Products:
├── GET    /products/               # List products (paginated)
├── POST   /products/               # Create product
├── GET    /products/{id}/          # Get specific product
├── PUT    /products/{id}/          # Update product
├── DELETE /products/{id}/          # Delete product
└── GET    /products/mine/          # User's products

Forecasting:
├── POST   /forecast/generate/      # Generate forecasts
├── GET    /forecast/overview/      # Dashboard summary
└── GET    /forecast/chart-data/    # Chart data

Admin:
├── GET    /auth/admin/supplier-requests/    # List requests
└── PATCH  /auth/admin/supplier-requests/{id}/ # Update request
```

### API Response Format
```json
{
  "success": true,
  "data": {
    "results": [...],
    "count": 100,
    "next": "http://api/products/?page=2",
    "previous": null
  },
  "message": "Products retrieved successfully"
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "details": {
      "price": ["This field must be a positive number"]
    }
  }
}
```

## 🔐 Security Architecture

### Authentication Flow
```
┌─────────┐    ┌─────────────┐    ┌──────────────┐
│ Client  │    │   Django    │    │   Database   │
│         │    │   Backend   │    │              │
│         │    │             │    │              │
│ Login   │───▶│ Validate    │───▶│ Check User   │
│         │    │ Credentials │    │              │
│         │    │             │    │              │
│ JWT     │◄───│ Generate    │◄───│ User Valid   │
│ Token   │    │ JWT Token   │    │              │
│         │    │             │    │              │
│ API     │───▶│ Verify      │    │              │
│ Request │    │ JWT Token   │    │              │
└─────────┘    └─────────────┘    └──────────────┘
```

### Permission Matrix Implementation
```python
# Backend Permission Classes
class IsAdminOrSupplierOwner(BasePermission):
    def has_permission(self, request, view):
        # View-level permissions
        
    def has_object_permission(self, request, view, obj):
        # Object-level permissions
```

### Security Layers
1. **Transport Security**: HTTPS in production
2. **Authentication**: JWT token-based auth
3. **Authorization**: Role-based permissions
4. **Input Validation**: Django form validation
5. **XSS Protection**: React's built-in sanitization
6. **CSRF Protection**: Django CSRF middleware

## 🔄 Data Flow

### Product Creation Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
│             │    │             │    │             │
│ User fills  │    │             │    │             │
│ product form│    │             │    │             │
│             │    │             │    │             │
│ POST        │───▶│ Validate    │    │             │
│ /products/  │    │ permissions │    │             │
│             │    │             │    │             │
│             │    │ Calculate   │    │             │
│             │    │ optimized   │    │             │
│             │    │ price       │    │             │
│             │    │             │    │             │
│             │    │ Save        │───▶│ INSERT      │
│             │    │ product     │    │ product     │
│             │    │             │    │             │
│ Product     │◄───│ Return      │◄───│ Return      │
│ created     │    │ response    │    │ product ID  │
│             │    │             │    │             │
│ Refresh     │───▶│ GET         │───▶│ SELECT      │
│ product     │    │ /products/  │    │ products    │
│ list        │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Price Optimization Flow
```
1. User requests price optimization
2. Backend fetches product data
3. Optimization algorithm analyzes:
   ├── Stock velocity
   ├── Category factors
   ├── Customer ratings
   └── Business constraints
4. Calculate optimized prices
5. Return recommendations
6. User applies changes (optional)
7. Update database with new prices
8. Record price history
```

### Demand Forecasting Flow
```
1. Select products for forecasting
2. Backend generates forecast using:
   ├── Historical data simulation
   ├── Category-specific growth patterns
   ├── Seasonal adjustments
   └── Price elasticity curves
3. Store forecast data (JSON format)
4. Generate chart data for frontend
5. Display interactive visualizations
```

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│                 │    │                 │
│ React Dev Server│◄──▶│ Django Dev      │
│ (Port 3000)     │    │ Server          │
│                 │    │ (Port 8000)     │
│ Hot Reload      │    │                 │
│ enabled         │    │ SQLite DB       │
└─────────────────┘    │ Debug enabled   │
                       └─────────────────┘
```

### Production Architecture (Recommended)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │    Database     │
│                 │    │                 │    │                 │
│    Nginx/       │───▶│  Gunicorn +     │───▶│   PostgreSQL    │
│   Cloudflare    │    │  Django API     │    │                 │
│                 │    │                 │    │ Connection      │
│ Static Files    │    │ Background      │    │ Pooling         │
│ CDN             │    │ Tasks (Celery)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │                 │
                       │ Session Cache   │
                       │ Task Queue      │
                       └─────────────────┘
```

### Container Architecture (Docker)
```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   Frontend  │ │   Backend   │ │    Database     │   │
│  │             │ │             │ │                 │   │
│  │ nginx:alpine│ │python:3.9   │ │postgres:13-alpine│   │
│  │ React build │ │Django + DRF │ │                 │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
│         │              │                 │             │
│         └──────────────┼─────────────────┘             │
│                        │                               │
│  ┌─────────────────────┴──────────────────┐           │
│  │            Shared Network               │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## 📈 Scalability Considerations

### Current Limitations & Solutions

#### 1. **Database Scalability**
```
Current: Single SQLite/PostgreSQL instance
Solutions:
├── Read Replicas (for heavy read workloads)
├── Database Sharding (by user/tenant)
├── Connection Pooling (PgBouncer)
└── Query Optimization (indexes, caching)
```

#### 2. **API Scalability**
```
Current: Single Django instance
Solutions:
├── Horizontal Scaling (multiple app instances)
├── Load Balancing (Nginx/HAProxy)
├── Caching Layer (Redis/Memcached)
├── API Rate Limiting
└── Asynchronous Tasks (Celery)
```

#### 3. **Frontend Scalability**
```
Current: React SPA
Solutions:
├── CDN Distribution (static assets)
├── Code Splitting (lazy loading)
├── Service Workers (offline capability)
├── Progressive Web App features
└── Edge Computing (Cloudflare Workers)
```

### Performance Optimization Strategies

#### Backend Optimizations
- **Database Queries**: `select_related()` and `prefetch_related()`
- **API Pagination**: Limit large dataset responses
- **Caching**: Redis for frequently accessed data
- **Background Tasks**: Celery for heavy computations

#### Frontend Optimizations  
- **Bundle Splitting**: Reduce initial load time
- **Lazy Loading**: Load components on demand
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Handle large datasets

### Monitoring & Observability
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │    Metrics      │    │     Alerts      │
│   Logging       │───▶│   Collection    │───▶│   Notification  │
│                 │    │                 │    │                 │
│ Django Logs     │    │ Prometheus/     │    │ Email/Slack     │
│ React Errors    │    │ Grafana         │    │ Notifications   │
│ API Metrics     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Future Architecture Enhancements

### Phase 2: Microservices
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │Product Service  │    │Pricing Service  │
│                 │    │                 │    │                 │
│ Authentication  │    │ CRUD Operations │    │ Optimization    │
│ Authorization   │    │ Search/Filter   │    │ Algorithms      │
│ Profile Mgmt    │    │ Categorization  │    │ ML Models       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │                 │
                    │ Request Routing │
                    │ Load Balancing  │
                    │ Authentication  │
                    └─────────────────┘
```

### Phase 3: Cloud-Native Architecture
- **Container Orchestration**: Kubernetes deployment
- **Service Mesh**: Istio for inter-service communication
- **Event-Driven Architecture**: Message queues (RabbitMQ/Apache Kafka)
- **Machine Learning Pipeline**: Automated price optimization
- **Multi-Region Deployment**: Global availability

---

## 📚 Additional Resources

- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [React Architecture Guide](https://reactjs.org/docs/thinking-in-react.html)
- [REST API Design Guidelines](https://restfulapi.net/)
- [Database Design Principles](https://www.vertabelo.com/blog/database-design-best-practices/)

---

*This architecture documentation is living document that evolves with the system.*