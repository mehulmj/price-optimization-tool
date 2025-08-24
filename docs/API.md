# 📡 API Documentation

> **Price Optimization Tool - REST API Reference**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Product Management](#product-management)
5. [Demand Forecasting](#demand-forecasting)
6. [Price Optimization](#price-optimization)
7. [Admin Operations](#admin-operations)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [API Testing](#api-testing)

## 🌐 Overview

### Base URL
```
Development: http://localhost:8000/api/
Production:  https://your-domain.com/api/
```

### API Versioning
```
Current Version: v1 (default)
Future Versions: /api/v2/ (when available)
```

### Content Type
All requests must include the following headers:
```http
Content-Type: application/json
Accept: application/json
```

### Standard Response Format
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔐 Authentication

### JWT Token-Based Authentication

#### Register New User
```http
POST /auth/register/
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "email": "john@example.com"
}
```

#### User Login
```http
POST /auth/login/
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Token Refresh
```http
POST /auth/token/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### User Logout
```http
POST /auth/logout/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Get Current User Profile
```http
GET /auth/me/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "supplier"
}
```

## 👥 User Management

### Email Verification
```http
GET /auth/verify-email/{uidb64}/{token}/
```

**Response (200 OK):**
```json
{
  "detail": "Email verified successfully! You can now login."
}
```

### Resend Verification Email
```http
POST /auth/resend-verification/
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Supplier Role Request
```http
POST /auth/supplier-request/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "company": "Tech Solutions Inc.",
  "reason": "I want to list and manage products for my company."
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "company": "Tech Solutions Inc.",
  "reason": "I want to list and manage products for my company.",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Supplier Request Status
```http
GET /auth/supplier-request/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "exists": true,
  "request": {
    "id": 5,
    "status": "approved",
    "company": "Tech Solutions Inc.",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

## 🛍️ Product Management

### List Products
```http
GET /products/
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `page_size` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by product name or description
- `category` (optional): Filter by category (`electronics`, `grocery`, `stationery`, `other`)
- `ordering` (optional): Sort by field (`name`, `current_price`, `created_at`, `-created_at`)

**Example Request:**
```http
GET /products/?search=laptop&category=electronics&page=1&page_size=10
```

**Response (200 OK):**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Gaming Laptop Pro",
      "category": "electronics",
      "description": "High-performance gaming laptop with RTX graphics",
      "base_price": "800.00",
      "current_price": "1200.00",
      "optimized_price": "1150.00",
      "min_price": "900.00",
      "max_price": "1500.00",
      "stock_qty": 50,
      "units_sold": 120,
      "customer_rating": 4,
      "demand_forecast": 200,
      "owner": 1,
      "owner_username": "supplier_user",
      "is_active": true,
      "created_at": "2024-01-10T09:15:00Z",
      "updated_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### Get Single Product
```http
GET /products/{id}/
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Gaming Laptop Pro",
  "category": "electronics",
  "description": "High-performance gaming laptop with RTX graphics",
  "base_price": "800.00",
  "current_price": "1200.00",
  "optimized_price": "1150.00",
  "min_price": "900.00",
  "max_price": "1500.00",
  "stock_qty": 50,
  "units_sold": 120,
  "customer_rating": 4,
  "demand_forecast": 200,
  "elasticity": 1.2,
  "profit_margin": 33.33,
  "stock_velocity": 2.4,
  "revenue_potential": 230000.00,
  "owner": 1,
  "owner_username": "supplier_user",
  "is_active": true,
  "created_at": "2024-01-10T09:15:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Create Product
```http
POST /products/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "Wireless Headphones",
  "category": "electronics",
  "description": "Premium noise-canceling wireless headphones",
  "base_price": "50.00",
  "current_price": "120.00",
  "min_price": "80.00",
  "max_price": "200.00",
  "stock_qty": 100,
  "units_sold": 0,
  "customer_rating": 0
}
```

**Response (201 Created):**
```json
{
  "id": 25,
  "name": "Wireless Headphones",
  "category": "electronics",
  "description": "Premium noise-canceling wireless headphones",
  "base_price": "50.00",
  "current_price": "120.00",
  "optimized_price": "122.40",
  "min_price": "80.00",
  "max_price": "200.00",
  "stock_qty": 100,
  "units_sold": 0,
  "customer_rating": 0,
  "demand_forecast": 0,
  "owner": 3,
  "owner_username": "current_user",
  "is_active": true,
  "created_at": "2024-01-15T16:45:00Z",
  "updated_at": "2024-01-15T16:45:00Z"
}
```

### Update Product
```http
PUT /products/{id}/
PATCH /products/{id}/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Request Body (PATCH example):**
```json
{
  "current_price": "135.00",
  "stock_qty": 85
}
```

**Response (200 OK):**
```json
{
  "id": 25,
  "name": "Wireless Headphones",
  "current_price": "135.00",
  "stock_qty": 85,
  "updated_at": "2024-01-15T17:20:00Z"
}
```

### Delete Product
```http
DELETE /products/{id}/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (204 No Content)**

### Get User's Products
```http
GET /products/mine/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": 25,
      "name": "Wireless Headphones",
      "category": "electronics",
      "current_price": "135.00",
      "owner_username": "current_user"
    }
  ]
}
```

### Product Price History
```http
GET /products/{id}/price-history/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
[
  {
    "id": 15,
    "old_price": "120.00",
    "new_price": "135.00",
    "changed_by": 3,
    "changed_by_username": "current_user",
    "reason": "Market price adjustment",
    "changed_at": "2024-01-15T17:20:00Z"
  }
]
```

## 📊 Demand Forecasting

### Generate Demand Forecasts
```http
POST /forecast/generate/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "product_ids": [1, 2, 3, 4],
  "method": "historical_simulation",
  "years": 5
}
```

**Response (201 Created):**
```json
{
  "message": "Generated forecasts for 4 products",
  "forecasts": [
    {
      "id": 10,
      "product": 1,
      "product_name": "Gaming Laptop Pro",
      "product_category": "electronics",
      "forecast_method": "historical_simulation",
      "start_year": 2020,
      "end_year": 2024,
      "forecast_data": [
        {"year": 2020, "demand": 150},
        {"year": 2021, "demand": 180},
        {"year": 2022, "demand": 210},
        {"year": 2023, "demand": 190},
        {"year": 2024, "demand": 220}
      ],
      "demand_price_curve": [
        {"price": 600.0, "demand": 300},
        {"price": 800.0, "demand": 250},
        {"price": 1000.0, "demand": 200},
        {"price": 1200.0, "demand": 150},
        {"price": 1400.0, "demand": 100}
      ],
      "total_forecasted_demand": 950,
      "confidence_score": 0.85,
      "created_at": "2024-01-15T18:00:00Z"
    }
  ]
}
```

### Get Forecast Overview
```http
GET /forecast/overview/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "total_products": 12,
  "total_forecasted_demand": 15000,
  "average_confidence": 0.82,
  "forecast_by_category": {
    "electronics": {
      "product_count": 5,
      "total_demand": 8000
    },
    "grocery": {
      "product_count": 4,
      "total_demand": 4500
    },
    "stationery": {
      "product_count": 3,
      "total_demand": 2500
    }
  },
  "recent_forecasts": [
    {
      "id": 10,
      "product_name": "Gaming Laptop Pro",
      "total_forecasted_demand": 950,
      "confidence_score": 0.85,
      "created_at": "2024-01-15T18:00:00Z"
    }
  ]
}
```

### Get Chart Data for Visualization
```http
GET /forecast/chart-data/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `product_ids` (optional): Comma-separated list of product IDs

**Example Request:**
```http
GET /forecast/chart-data/?product_ids=1,2,3,4
```

**Response (200 OK):**
```json
{
  "historical_data": [
    {
      "year": 2020,
      "Gaming Laptop Pro": 150,
      "Wireless Mouse": 80,
      "USB Cable": 200,
      "Monitor Stand": 120
    },
    {
      "year": 2021,
      "Gaming Laptop Pro": 180,
      "Wireless Mouse": 95,
      "USB Cable": 220,
      "Monitor Stand": 140
    }
  ],
  "demand_price_curves": [
    {
      "product_id": 1,
      "product_name": "Gaming Laptop Pro",
      "curve_data": [
        {"price": 600.0, "demand": 300},
        {"price": 800.0, "demand": 250},
        {"price": 1000.0, "demand": 200}
      ]
    }
  ]
}
```

## 💰 Price Optimization

### Get Price Optimization Analysis
```http
GET /pricing/optimize-all/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `category` (optional): Filter by product category

**Response (200 OK):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Gaming Laptop Pro",
      "category": "electronics",
      "current_price": 1200.00,
      "optimized_price": 1150.00,
      "price_change": -50.00,
      "price_change_percent": -4.2,
      "confidence_score": 88,
      "reasoning": "High demand product - price reduction to accelerate sales | Current pricing is near optimal",
      "units_sold": 120,
      "stock_qty": 50
    }
  ],
  "summary": {
    "total_products": 15,
    "products_with_increases": 6,
    "products_with_decreases": 4,
    "avg_confidence_score": 82.5,
    "total_current_revenue": 125000.00,
    "potential_revenue_increase": 3250.00,
    "revenue_impact_percent": 2.6
  }
}
```

### Apply Price Optimization
```http
POST /pricing/apply-optimization/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "product_ids": [1, 2, 3],
  "reason": "Quarterly price optimization based on market analysis"
}
```

**Response (200 OK):**
```json
{
  "updated_products": [
    {
      "id": 1,
      "name": "Gaming Laptop Pro",
      "old_price": 1200.00,
      "new_price": 1150.00,
      "change": -50.00
    }
  ],
  "total_updated": 1,
  "message": "Successfully updated prices for 1 products"
}
```

### Market Analysis
```http
GET /pricing/market-analysis/
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "market_analysis": {
    "electronics": {
      "category_name": "Electronics",
      "product_count": 8,
      "price_stats": {
        "min": 25.99,
        "max": 1500.00,
        "avg": 425.50,
        "median": 299.99
      },
      "optimization_potential": {
        "overpriced_count": 2,
        "underpriced_count": 1,
        "optimal_count": 5
      }
    }
  },
  "recommendations": [
    "Consider competitive pricing for high-elasticity products",
    "Premium pricing opportunities exist for unique products",
    "Monitor competitor pricing for market positioning",
    "Regular price optimization can improve margins by 3-8%"
  ]
}
```

## 👑 Admin Operations

### List All Supplier Requests
```http
GET /auth/admin/supplier-requests/
```

**Headers:**
```http
Authorization: Bearer {admin_access_token}
```

**Query Parameters:**
- `page` (optional): Page number
- `page_size` (optional): Items per page

**Response (200 OK):**
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "username": "john_doe",
      "email": "john@example.com",
      "company": "Tech Solutions Inc.",
      "reason": "I want to list and manage products for my company.",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Update Supplier Request Status
```http
PATCH /auth/admin/supplier-requests/{id}/
```

**Headers:**
```http
Authorization: Bearer {admin_access_token}
```

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "username": "john_doe",
  "email": "john@example.com",
  "company": "Tech Solutions Inc.",
  "reason": "I want to list and manage products for my company.",
  "status": "approved",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T18:45:00Z"
}
```

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2024-01-15T18:45:00Z"
  }
}
```

### HTTP Status Codes

| Status Code | Description | Usage |
|------------|-------------|-------|
| `200 OK` | Success | Successful GET, PUT, PATCH requests |
| `201 Created` | Resource created | Successful POST requests |
| `204 No Content` | Success, no response body | Successful DELETE requests |
| `400 Bad Request` | Invalid request | Validation errors, malformed JSON |
| `401 Unauthorized` | Authentication required | Missing or invalid token |
| `403 Forbidden` | Access denied | Insufficient permissions |
| `404 Not Found` | Resource not found | Invalid resource ID |
| `409 Conflict` | Resource conflict | Duplicate resource creation |
| `422 Unprocessable Entity` | Validation failed | Business logic validation errors |
| `429 Too Many Requests` | Rate limit exceeded | API rate limiting |
| `500 Internal Server Error` | Server error | Unexpected server errors |

### Common Error Examples

#### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "current_price": ["This field must be a positive number"],
      "name": ["This field is required"]
    }
  }
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```

#### Permission Error (403)
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You don't have permission to access this resource",
    "details": {
      "required_role": "supplier",
      "current_role": "buyer"
    }
  }
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Product not found",
    "details": {
      "resource": "product",
      "id": 999
    }
  }
}
```

## 🚦 Rate Limiting

### Current Limits
- **Anonymous users**: 100 requests per hour
- **Authenticated users**: 1000 requests per hour
- **Admin users**: 5000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642268400
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "reset_time": "2024-01-15T19:00:00Z"
    }
  }
}
```

## 🧪 API Testing

### Using cURL

#### Login and Get Token
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

#### Create Product with Token
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "name": "Test Product",
    "category": "electronics",
    "base_price": "50.00",
    "current_price": "100.00"
  }'
```

### Using Python Requests
```python
import requests

# Login
login_response = requests.post(
    'http://localhost:8000/api/auth/login/',
    json={
        'username': 'your_username',
        'password': 'your_password'
    }
)
token = login_response.json()['access']

# Create product
headers = {'Authorization': f'Bearer {token}'}
product_response = requests.post(
    'http://localhost:8000/api/products/',
    headers=headers,
    json={
        'name': 'Test Product',
        'category': 'electronics',
        'base_price': '50.00',
        'current_price': '100.00'
    }
)

*For support or questions about this API, please contact the development team or create an issue in the project repository.*