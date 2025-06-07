# RetailAI Manager API Documentation

This document outlines the REST API endpoints available for mobile app integration.

## Authentication

All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Endpoints

### Products API

#### Get All Products
```http
GET /products
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "sku": "SKU-001",
    "category": "Electronics",
    "price": 29.99,
    "stock": 100,
    "min_stock": 20,
    "location_id": "uuid",
    "location": {
      "name": "Store Name"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Single Product
```http
GET /products/{id}
```

#### Create Product
```http
POST /products
Content-Type: application/json

{
  "name": "New Product",
  "sku": "SKU-002",
  "category": "Electronics",
  "price": 39.99,
  "stock": 50,
  "min_stock": 10,
  "location_id": "uuid"
}
```

#### Update Product
```http
PUT /products/{id}
Content-Type: application/json

{
  "stock": 75,
  "price": 34.99
}
```

#### Delete Product
```http
DELETE /products/{id}
```

### Locations API

#### Get All Locations
```http
GET /locations
```

#### Create Location
```http
POST /locations
Content-Type: application/json

{
  "name": "New Store",
  "address": "123 Main St, City",
  "manager": "John Doe",
  "status": "active"
}
```

#### Update Location
```http
PUT /locations/{id}
Content-Type: application/json

{
  "status": "inactive",
  "manager": "Jane Smith"
}
```

#### Delete Location
```http
DELETE /locations/{id}
```

### Sales API

#### Get All Sales
```http
GET /sales
```

#### Create Sale
```http
POST /sales
Content-Type: application/json

{
  "timestamp": "2024-01-01T12:00:00Z",
  "location_id": "uuid",
  "total": 99.99,
  "items": 3,
  "staff": "Store Clerk",
  "payment_method": "Credit Card"
}
```

#### Update Sale
```http
PUT /sales/{id}
Content-Type: application/json

{
  "total": 109.99,
  "items": 4
}
```

#### Delete Sale
```http
DELETE /sales/{id}
```

### Alerts API

#### Get All Alerts
```http
GET /alerts
```

#### Create Alert
```http
POST /alerts
Content-Type: application/json

{
  "type": "low_stock",
  "severity": "high",
  "message": "Critical: Product XYZ is out of stock",
  "location_id": "uuid",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Resolve Alert
```http
PUT /alerts/{id}/resolve
```

#### Delete Alert
```http
DELETE /alerts/{id}
```

### AI Reports API

#### Get All Reports
```http
GET /ai-reports
```

#### Parse Text with AI
```http
POST /ai-reports/parse
Content-Type: application/json

{
  "text": "Sold 5 smartphones today, restocked coffee beans",
  "confidence_threshold": 85
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": 2500,
    "inventory": [
      {
        "item": "smartphones",
        "count": -5,
        "action": "sold"
      },
      {
        "item": "coffee beans",
        "count": 20,
        "action": "restocked"
      }
    ]
  },
  "confidence": 0.89
}
```

#### Create Report
```http
POST /ai-reports
Content-Type: application/json

{
  "location_id": "uuid",
  "staff": "John Doe",
  "raw_text": "Daily report text here",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### User Settings API

#### Get User Settings
```http
GET /user-settings
```

#### Update User Settings
```http
PUT /user-settings
Content-Type: application/json

{
  "ai_settings": {
    "confidenceThreshold": 90,
    "currency": "USD"
  },
  "notification_preferences": {
    "lowStock": false
  }
}
```

### Analytics API

#### Get Analytics Data
```http
GET /analytics?timeRange=30d
```

**Query Parameters:**
- `timeRange`: `7d`, `30d`, or `90d` (default: `30d`)

**Response:**
```json
{
  "overview": {
    "totalRevenue": 45200,
    "totalOrders": 180,
    "avgOrderValue": 251.11,
    "revenueGrowth": 12.5
  },
  "salesTrends": {
    "daily": [
      {
        "date": "Jan 1",
        "revenue": 1500,
        "orders": 6
      }
    ]
  },
  "productAnalytics": {
    "topProducts": [],
    "lowStockAlerts": []
  }
}
```

## Error Responses

All errors return a JSON object with an error message:

```json
{
  "error": "Unauthorized"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

## Rate Limiting

API endpoints are subject to Supabase's standard rate limits. For production use, consider implementing caching and request optimization.

## Mobile Integration Example

```javascript
// React Native example
const API_BASE = 'https://your-project.supabase.co/functions/v1';

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  return response.json();
};

// Usage
const products = await apiCall('/products');
const analytics = await apiCall('/analytics?timeRange=7d');
```

## Architecture Benefits

### For Web App
- **Centralized business logic** - All data processing happens server-side
- **Better performance** - Reduced client-side processing
- **Consistent data handling** - Same validation and processing for all clients
- **Enhanced security** - API keys and sensitive operations stay server-side

### For Mobile App
- **Lightweight client** - Mobile app just handles UI and API calls
- **Shared functionality** - Same business logic as web app
- **Offline capability** - Can cache API responses for offline use
- **Platform consistency** - Identical functionality across platforms

### Deployment Notes
These Edge Functions are automatically deployed to your Supabase project. They run serverless and scale automatically based on demand.