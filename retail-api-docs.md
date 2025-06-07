# RetailAI Manager - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Real-time Notifications](#real-time-notifications)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Mobile App Integration](#mobile-app-integration)
9. [Development Setup](#development-setup)
10. [Deployment](#deployment)

---

## Overview

RetailAI Manager is a comprehensive retail management platform with AI-powered reporting, inventory tracking, sales management, and analytics. The system consists of:

- **Web Application**: React/TypeScript frontend with Tailwind CSS
- **Backend**: Supabase with PostgreSQL database and Edge Functions
- **AI Services**: Google Gemini API for natural language processing
- **Authentication**: Complete API-based authentication system
- **Real-time Features**: Server-Sent Events for live notifications
- **Mobile API**: RESTful API for mobile app integration

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile App    │    │   External      │
│   (React/TS)    │    │   (Any Platform)│    │   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                 ┌─────────────────────────────────┐
                 │        Supabase Backend         │
                 │  ┌─────────────────────────────┐ │
                 │  │     Edge Functions API      │ │
                 │  │  - Authentication (/auth)   │ │
                 │  │  - Business Logic (/*)      │ │
                 │  │  - Real-time (/notifications) │ │
                 │  └─────────────────────────────┘ │
                 │  ┌─────────────────────────────┐ │
                 │  │    PostgreSQL Database      │ │
                 │  └─────────────────────────────┘ │
                 │  ┌─────────────────────────────┐ │
                 │  │    Authentication (Auth)    │ │
                 │  └─────────────────────────────┘ │
                 └─────────────────────────────────┘
                                 │
                 ┌─────────────────────────────────┐
                 │       External APIs             │
                 │  - Google Gemini (AI)           │
                 │  - Real-time SSE Streams        │
                 └─────────────────────────────────┘
```

---

## Authentication

The system uses a complete API-based authentication system compatible with all platforms including mobile apps.

### Authentication Flow

1. **Sign Up/Sign In**: Use authentication API endpoints
2. **Token Management**: Automatic token refresh and storage
3. **Session Persistence**: Secure token-based sessions
4. **Password Reset**: Email-based password recovery

### Base URL for Authentication
```
https://your-project.supabase.co/functions/v1/auth
```

### Authentication Endpoints

#### Sign In
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "expires_at": 1234567890
  },
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here"
}
```

#### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securepassword"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "email_confirmed_at": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": null,
  "message": "Check your email for the confirmation link"
}
```

#### Sign Out
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token_here"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  },
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent successfully"
}
```

#### Get Current Session
```http
GET /auth/session
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "current_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

### Token Management

All API requests (except authentication) require a Bearer token:
```http
Authorization: Bearer <access_token>
```

**Token Storage (Mobile Apps):**
- Store `access_token` and `refresh_token` securely
- Implement automatic token refresh before expiry
- Clear tokens on sign out

**Token Refresh Strategy:**
- Tokens expire after 1 hour
- Implement automatic refresh 15 minutes before expiry
- Use refresh token to get new access token

---

## Real-time Notifications

The system provides real-time notifications using Server-Sent Events (SSE) compatible with web and mobile applications.

### Base URL for Notifications
```
https://your-project.supabase.co/functions/v1/notifications
```

### Notification Endpoints

#### Subscribe to Real-time Stream
```http
GET /notifications/stream
Authorization: Bearer <access_token>
Accept: text/event-stream
Cache-Control: no-cache
```

**Response (SSE Stream):**
```
data: {"type":"connection","message":"Connected to real-time notifications","timestamp":"2024-01-01T00:00:00Z"}

data: {"type":"heartbeat","timestamp":"2024-01-01T00:00:30Z"}

data: {"id":"uuid","type":"alert","title":"Low Stock Alert","message":"Product XYZ is running low","timestamp":"2024-01-01T00:01:00Z","data":{"productId":"uuid","currentStock":2}}

data: {"id":"uuid","type":"report","title":"AI Report Processed","message":"Daily report has been processed successfully","timestamp":"2024-01-01T00:02:00Z"}
```

#### Send Notification
```http
POST /notifications/send
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "alert",
  "title": "Custom Alert",
  "message": "Something important happened",
  "userId": "uuid_optional_for_targeted_notification",
  "data": {
    "customField": "customValue"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent",
  "notification": {
    "id": "uuid",
    "type": "alert",
    "title": "Custom Alert",
    "message": "Something important happened",
    "timestamp": "2024-01-01T00:00:00Z",
    "fromUserId": "sender_uuid"
  }
}
```

### Notification Types

1. **`alert`** - Critical system alerts (low stock, high returns)
2. **`report`** - AI report processing updates
3. **`system`** - System maintenance, updates
4. **`connection`** - Connection status (internal)
5. **`heartbeat`** - Keep-alive pings (internal)

### Mobile Implementation Example

```javascript
// React Native / Mobile Implementation
class NotificationService {
  constructor(apiUrl, accessToken) {
    this.apiUrl = apiUrl;
    this.accessToken = accessToken;
    this.eventSource = null;
  }

  connect(onNotification) {
    const url = `${this.apiUrl}/notifications/stream`;
    
    this.eventSource = new EventSource(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    this.eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      // Skip internal messages
      if (notification.type === 'heartbeat') return;
      
      onNotification(notification);
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      // Implement reconnection logic
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

---

## Database Schema

### Core Tables

#### `user_settings`
User preferences and configuration.

```sql
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_data jsonb DEFAULT '{}',
  notification_preferences jsonb DEFAULT '{}',
  ai_settings jsonb DEFAULT '{}',
  security_settings jsonb DEFAULT '{}',
  appearance_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `locations`
Store locations and branches.

```sql
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  manager text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'attention')),
  sales numeric DEFAULT 0,
  inventory numeric DEFAULT 0,
  last_report text DEFAULT 'Never',
  alerts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### `products`
Product catalog and inventory.

```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  last_updated text DEFAULT 'Never',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### `sales`
Sales transactions.

```sql
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  total numeric NOT NULL CHECK (total >= 0),
  items integer NOT NULL DEFAULT 1 CHECK (items > 0),
  staff text NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### `alerts`
System alerts and notifications.

```sql
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('low_stock', 'high_return', 'unusual_activity', 'sales_spike', 'system')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  message text NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### `reports`
AI-powered reports and analysis.

```sql
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  staff text NOT NULL,
  raw_text text NOT NULL,
  parsed_data jsonb DEFAULT '{}',
  confidence numeric DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  status text DEFAULT 'pending' CHECK (status IN ('processed', 'pending', 'flagged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### `inventory_adjustments`
Track inventory changes outside of sales.

```sql
CREATE TABLE inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change integer NOT NULL CHECK (quantity_change != 0),
  reason text NOT NULL CHECK (reason IN ('damaged', 'expired', 'theft', 'restock', 'recount', 'promotion', 'transfer', 'other')),
  notes text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### `sales_returns`
Track product returns and refunds.

```sql
CREATE TABLE sales_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity_returned integer CHECK (quantity_returned > 0),
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0),
  reason text NOT NULL CHECK (reason IN ('defective', 'wrong_item', 'customer_change_mind', 'damaged', 'expired', 'duplicate', 'other')),
  notes text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  staff text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Base URL
```
https://your-project.supabase.co/functions/v1
```

### Products API

#### Get Products
```http
GET /products
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `category` (string): Filter by product category
- `location_id` (uuid): Filter by location
- `low_stock` (boolean): Show only low stock items
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `search` (string): Search in name and SKU
- `sku` (string): Exact SKU match
- `sort_by` (string): Field to sort by (default: created_at)
- `sort_order` (string): asc/desc (default: desc)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Wireless Headphones",
    "sku": "WH-001",
    "category": "Electronics",
    "price": 99.99,
    "stock": 25,
    "min_stock": 5,
    "location_id": "uuid",
    "location": {
      "name": "Main Store"
    },
    "last_updated": "2024-01-15",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "user_id": "uuid"
  }
]
```

#### Get Single Product
```http
GET /products/{id}
Authorization: Bearer <access_token>
```

#### Create Product
```http
POST /products
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Bluetooth Speaker",
  "sku": "BS-001",
  "category": "Electronics",
  "price": 79.99,
  "stock": 15,
  "min_stock": 3,
  "location_id": "uuid"
}
```

#### Update Product
```http
PUT /products/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "stock": 20,
  "price": 89.99
}
```

#### Delete Product
```http
DELETE /products/{id}
Authorization: Bearer <access_token>
```

### Locations API

#### Get Locations
```http
GET /locations
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (string): Filter by status (active/inactive/attention)
- `manager` (string): Filter by manager name
- `search` (string): Search in name, address, manager
- `sort_by` (string): Field to sort by
- `sort_order` (string): asc/desc
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Downtown Store",
    "address": "123 Main St, City",
    "manager": "John Doe",
    "status": "active",
    "sales": 12500.00,
    "inventory": 45000.00,
    "last_report": "2024-01-15",
    "alerts": 2,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "user_id": "uuid"
  }
]
```

#### Create Location
```http
POST /locations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "West Side Store",
  "address": "456 Oak Ave, City",
  "manager": "Jane Smith",
  "status": "active"
}
```

#### Update Location
```http
PUT /locations/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "manager": "Bob Johnson",
  "status": "attention"
}
```

#### Delete Location
```http
DELETE /locations/{id}
Authorization: Bearer <access_token>
```

### Sales API

#### Get Sales
```http
GET /sales
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `location_id` (uuid): Filter by location
- `payment_method` (string): Filter by payment method
- `staff` (string): Filter by staff member
- `start_date` (ISO date): Start date filter
- `end_date` (ISO date): End date filter
- `min_total` (number): Minimum sale amount
- `max_total` (number): Maximum sale amount
- `min_items` (number): Minimum items count
- `max_items` (number): Maximum items count
- `sort_by` (string): Field to sort by
- `sort_order` (string): asc/desc
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-01-15T14:30:00Z",
    "location_id": "uuid",
    "location": {
      "name": "Downtown Store"
    },
    "total": 259.99,
    "items": 3,
    "staff": "Alice Johnson",
    "payment_method": "Credit Card",
    "created_at": "2024-01-15T14:30:00Z",
    "user_id": "uuid"
  }
]
```

#### Create Sale
```http
POST /sales
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "timestamp": "2024-01-15T14:30:00Z",
  "location_id": "uuid",
  "total": 159.99,
  "items": 2,
  "staff": "Store Clerk",
  "payment_method": "Cash"
}
```

#### Update Sale
```http
PUT /sales/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "total": 169.99,
  "items": 3
}
```

#### Delete Sale
```http
DELETE /sales/{id}
Authorization: Bearer <access_token>
```

### Alerts API

#### Get Alerts
```http
GET /alerts
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type` (string): Filter by alert type
- `severity` (string): Filter by severity (low/medium/high)
- `resolved` (boolean): Filter by resolution status
- `location_id` (uuid): Filter by location
- `start_date` (ISO date): Start date filter
- `end_date` (ISO date): End date filter
- `sort_by` (string): Field to sort by
- `sort_order` (string): asc/desc
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "low_stock",
    "severity": "high",
    "message": "Critical: Product XYZ is running low on stock",
    "location_id": "uuid",
    "location": {
      "name": "Downtown Store"
    },
    "timestamp": "2024-01-15T12:00:00Z",
    "resolved": false,
    "created_at": "2024-01-15T12:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "user_id": "uuid"
  }
]
```

#### Create Alert
```http
POST /alerts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "system",
  "severity": "medium",
  "message": "System maintenance scheduled",
  "location_id": "uuid",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

#### Resolve Alert
```http
PUT /alerts/{id}/resolve
Authorization: Bearer <access_token>
```

#### Delete Alert
```http
DELETE /alerts/{id}
Authorization: Bearer <access_token>
```

### AI Reports API

#### Get Reports
```http
GET /ai-reports
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-01-15T10:00:00Z",
    "location_id": "uuid",
    "location": {
      "name": "Downtown Store"
    },
    "staff": "John Doe",
    "raw_text": "Sold 5 smartphones today, customer complained about slow service",
    "parsed_data": {
      "sales": 2500,
      "inventory": [
        {
          "item": "smartphones",
          "count": -5,
          "action": "sold"
        }
      ],
      "customer_feedback": "Customer complained about slow service"
    },
    "confidence": 0.89,
    "status": "processed",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:05:00Z",
    "user_id": "uuid"
  }
]
```

#### Parse Text with AI
```http
POST /ai-reports/parse
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Sold 3 laptops and 2 mice today, restocked office supplies",
  "confidence_threshold": 85
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": 3500,
    "inventory": [
      {
        "item": "laptops",
        "count": -3,
        "action": "sold"
      },
      {
        "item": "mice",
        "count": -2,
        "action": "sold"
      },
      {
        "item": "office supplies",
        "count": 50,
        "action": "restocked"
      }
    ]
  },
  "confidence": 0.92
}
```

#### Create Report
```http
POST /ai-reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "location_id": "uuid",
  "staff": "John Doe",
  "raw_text": "Daily report: good sales, need more inventory",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Inventory Adjustments API

#### Get Inventory Adjustments
```http
GET /inventory-adjustments
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `product_id` (uuid): Filter by product
- `reason` (string): Filter by adjustment reason
- `start_date` (ISO date): Start date filter
- `end_date` (ISO date): End date filter
- `location_id` (uuid): Filter by location
- `sort_by` (string): Field to sort by
- `sort_order` (string): asc/desc
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "product": {
      "id": "uuid",
      "name": "Wireless Mouse",
      "sku": "WM-001"
    },
    "quantity_change": -5,
    "reason": "damaged",
    "notes": "Water damage from roof leak",
    "timestamp": "2024-01-15T09:00:00Z",
    "created_at": "2024-01-15T09:00:00Z",
    "user_id": "uuid"
  }
]
```

#### Create Inventory Adjustment
```http
POST /inventory-adjustments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "product_id": "uuid",
  "quantity_change": 10,
  "reason": "restock",
  "notes": "Weekly restock delivery",
  "timestamp": "2024-01-15T09:00:00Z"
}
```

#### Delete Inventory Adjustment
```http
DELETE /inventory-adjustments/{id}
Authorization: Bearer <access_token>
```

### Sales Returns API

#### Get Sales Returns
```http
GET /sales-returns
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `original_sale_id` (uuid): Filter by original sale
- `product_id` (uuid): Filter by product
- `reason` (string): Filter by return reason
- `start_date` (ISO date): Start date filter
- `end_date` (ISO date): End date filter
- `location_id` (uuid): Filter by location
- `staff` (string): Filter by staff member
- `sort_by` (string): Field to sort by
- `sort_order` (string): asc/desc
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
[
  {
    "id": "uuid",
    "original_sale_id": "uuid",
    "original_sale": {
      "id": "uuid",
      "total": 299.99,
      "timestamp": "2024-01-14T15:00:00Z"
    },
    "product_id": "uuid",
    "product": {
      "id": "uuid",
      "name": "Bluetooth Headphones",
      "sku": "BH-001"
    },
    "quantity_returned": 1,
    "refund_amount": 99.99,
    "reason": "defective",
    "notes": "Audio cutting out intermittently",
    "timestamp": "2024-01-15T11:00:00Z",
    "location_id": "uuid",
    "location": {
      "id": "uuid",
      "name": "Downtown Store"
    },
    "staff": "Customer Service Rep",
    "created_at": "2024-01-15T11:00:00Z",
    "user_id": "uuid"
  }
]
```

#### Create Sales Return
```http
POST /sales-returns
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "original_sale_id": "uuid",
  "product_id": "uuid",
  "quantity_returned": 1,
  "refund_amount": 79.99,
  "reason": "customer_change_mind",
  "notes": "Customer decided on different color",
  "timestamp": "2024-01-15T11:00:00Z",
  "location_id": "uuid",
  "staff": "Store Manager"
}
```

#### Delete Sales Return
```http
DELETE /sales-returns/{id}
Authorization: Bearer <access_token>
```

### User Settings API

#### Get User Settings
```http
GET /user-settings
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "profile_data": {
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "Store Manager"
  },
  "notification_preferences": {
    "lowStock": true,
    "highSales": true,
    "unusualActivity": true,
    "dailyReports": false,
    "weeklyReports": true,
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true
  },
  "ai_settings": {
    "confidenceThreshold": 85,
    "autoProcessReports": true,
    "enableVoiceInput": true,
    "language": "en",
    "timezone": "America/New_York",
    "currency": "USD",
    "country": "US"
  },
  "security_settings": {
    "twoFactorAuth": false,
    "passwordExpiry": 90,
    "sessionTimeout": 30,
    "loginAttempts": 5
  },
  "appearance_settings": {
    "theme": "light",
    "primaryColor": "blue",
    "compactMode": false
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Update User Settings
```http
PUT /user-settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "ai_settings": {
    "confidenceThreshold": 90,
    "currency": "EUR"
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
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `timeRange` (string): 7d, 30d, or 90d (default: 30d)

**Response:**
```json
{
  "overview": {
    "totalRevenue": 45200.50,
    "totalOrders": 180,
    "avgOrderValue": 251.11,
    "topSellingCategory": "Electronics",
    "revenueGrowth": 12.5,
    "ordersGrowth": 8.7,
    "customerRetention": 76.5,
    "profitMargin": 23.8
  },
  "salesTrends": {
    "daily": [
      {
        "date": "Jan 1",
        "revenue": 1500.00,
        "orders": 6,
        "customers": 18
      },
      {
        "date": "Jan 2",
        "revenue": 2200.00,
        "orders": 9,
        "customers": 24
      }
    ],
    "weekly": [],
    "monthly": []
  },
  "productAnalytics": {
    "topProducts": [
      {
        "name": "iPhone 15 Pro",
        "revenue": 12500.00,
        "quantity": 25,
        "growth": 15.2
      }
    ],
    "categoryPerformance": [
      {
        "category": "Electronics",
        "revenue": 25000.00,
        "growth": 12.5,
        "efficiency": 87.3
      }
    ],
    "lowStockAlerts": [
      {
        "name": "Wireless Mouse",
        "currentStock": 3,
        "minStock": 10,
        "daysLeft": 7
      }
    ]
  },
  "locationAnalytics": {
    "performance": [
      {
        "name": "Downtown Store",
        "revenue": 18500.00,
        "growth": 8.2,
        "efficiency": 92.1
      }
    ],
    "comparison": []
  },
  "customerInsights": {
    "segments": [
      {
        "name": "High Value",
        "count": 45,
        "avgSpend": 285.50,
        "retention": 92.3
      }
    ],
    "behavior": {
      "peakHours": [],
      "seasonality": []
    }
  },
  "predictiveAnalytics": {
    "salesForecast": [
      {
        "date": "Jan 16",
        "predicted": 2100.00,
        "confidence": 87.5
      }
    ],
    "inventoryNeeds": [
      {
        "product": "Wireless Earbuds",
        "suggestedOrder": 25,
        "urgency": "medium"
      }
    ],
    "trends": [
      {
        "metric": "Revenue",
        "direction": "up",
        "impact": 12.5
      }
    ]
  }
}
```

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created successfully
- `400`: Bad Request (validation error, missing fields)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

### Example Error Responses

#### 400 Bad Request
```json
{
  "error": "Product not found or unauthorized"
}
```

#### 401 Unauthorized
```json
{
  "error": "No authorization header"
}
```

#### 404 Not Found
```json
{
  "error": "Sale not found or unauthorized"
}
```

### Authentication Errors

#### Invalid Credentials
```json
{
  "error": "Invalid login credentials"
}
```

#### Token Expired
```json
{
  "error": "Token has expired"
}
```

#### Refresh Token Invalid
```json
{
  "error": "Invalid refresh token"
}
```

---

## Rate Limiting

API endpoints are subject to Supabase's standard rate limits:

- **Free Plan**: 500 requests per second
- **Pro Plan**: 1000 requests per second
- **Pay-as-you-scale**: Custom limits

### Best Practices
1. Implement exponential backoff for retries
2. Cache responses where appropriate
3. Use pagination for large datasets
4. Batch operations when possible
5. Implement request queuing for high-frequency operations

---

## Mobile App Integration

### Complete Mobile SDK Example

```javascript
class RetailAPI {
  constructor(supabaseUrl, supabaseKey) {
    this.baseUrl = `${supabaseUrl}/functions/v1`;
    this.authTokens = {
      access_token: null,
      refresh_token: null
    };
    this.notificationService = null;
  }

  // Token Management
  setTokens(accessToken, refreshToken) {
    this.authTokens.access_token = accessToken;
    this.authTokens.refresh_token = refreshToken;
    // Store securely (Keychain/KeyStore)
    this.storeTokensSecurely(accessToken, refreshToken);
  }

  async getAuthHeaders() {
    // Auto-refresh if needed
    await this.ensureValidToken();
    
    return {
      'Authorization': `Bearer ${this.authTokens.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async ensureValidToken() {
    // Check if token needs refresh (implement JWT parsing)
    if (this.tokenNeedsRefresh()) {
      await this.refreshTokens();
    }
  }

  async refreshTokens() {
    if (!this.authTokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        refresh_token: this.authTokens.refresh_token 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Token refresh failed');
    }

    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async request(endpoint, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  }

  // Authentication Methods
  async signIn(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Sign in failed');
    }

    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async signUp(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Sign up failed');
    }

    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
    }
    
    return data;
  }

  async signOut() {
    if (this.authTokens.access_token) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authTokens.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    this.clearTokens();
    if (this.notificationService) {
      this.notificationService.disconnect();
    }
  }

  // Business Operations
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/products?${params}`);
  }

  async createProduct(product) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async getSales(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/sales?${params}`);
  }

  async createSale(sale) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async getLocations(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/locations?${params}`);
  }

  async createLocation(location) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  async getAlerts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/alerts?${params}`);
  }

  async createAlert(alert) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async resolveAlert(alertId) {
    return this.request(`/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  }

  async getReports() {
    return this.request('/ai-reports');
  }

  async createReport(report) {
    return this.request('/ai-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async parseText(text, confidenceThreshold) {
    return this.request('/ai-reports/parse', {
      method: 'POST',
      body: JSON.stringify({ text, confidence_threshold: confidenceThreshold }),
    });
  }

  async getInventoryAdjustments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/inventory-adjustments?${params}`);
  }

  async createInventoryAdjustment(adjustment) {
    return this.request('/inventory-adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  }

  async getSalesReturns(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/sales-returns?${params}`);
  }

  async createSalesReturn(salesReturn) {
    return this.request('/sales-returns', {
      method: 'POST',
      body: JSON.stringify(salesReturn),
    });
  }

  async getSettings() {
    return this.request('/user-settings');
  }

  async updateSettings(settings) {
    return this.request('/user-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getAnalytics(timeRange = '30d') {
    return this.request(`/analytics?timeRange=${timeRange}`);
  }

  // Real-time Notifications
  connectToNotifications(onNotification, onConnectionStatus) {
    this.notificationService = new NotificationService(
      this.baseUrl, 
      this.authTokens.access_token
    );
    
    this.notificationService.connect(onNotification, onConnectionStatus);
    return this.notificationService;
  }

  async sendNotification(notification) {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }
}

// Notification Service for Real-time Updates
class NotificationService {
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  connect(onNotification, onConnectionStatus) {
    const url = `${this.baseUrl}/notifications/stream`;
    
    this.eventSource = new EventSource(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    this.eventSource.onopen = () => {
      console.log('Connected to notifications');
      this.reconnectAttempts = 0;
      if (onConnectionStatus) onConnectionStatus(true);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        
        // Skip internal messages
        if (notification.type === 'heartbeat') return;
        
        if (notification.type === 'connection') {
          if (onConnectionStatus) onConnectionStatus(true);
          return;
        }
        
        if (onNotification) onNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      if (onConnectionStatus) onConnectionStatus(false);
      
      // Implement reconnection logic
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(onNotification, onConnectionStatus);
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Usage Example
const api = new RetailAPI(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Authentication
try {
  const user = await api.signIn('user@example.com', 'password');
  console.log('Signed in:', user);
} catch (error) {
  console.error('Sign in failed:', error);
}

// Business Operations
const products = await api.getProducts({ low_stock: true });
const newSale = await api.createSale({
  timestamp: new Date().toISOString(),
  location_id: 'location-uuid',
  total: 99.99,
  items: 2,
  staff: 'Mobile User',
  payment_method: 'Credit Card'
});

// Real-time Notifications
api.connectToNotifications(
  (notification) => {
    console.log('New notification:', notification);
    // Handle notification in UI
  },
  (connected) => {
    console.log('Connection status:', connected);
    // Update UI connection indicator
  }
);
```

### React Native Specific Implementation

```javascript
// storage.js - Secure token storage
import * as Keychain from 'react-native-keychain';

export const tokenStorage = {
  async setTokens(accessToken, refreshToken) {
    await Keychain.setInternetCredentials(
      'retail-app-tokens',
      'access_token',
      accessToken
    );
    
    if (refreshToken) {
      await Keychain.setInternetCredentials(
        'retail-app-refresh',
        'refresh_token',
        refreshToken
      );
    }
  },

  async getTokens() {
    try {
      const accessCreds = await Keychain.getInternetCredentials('retail-app-tokens');
      const refreshCreds = await Keychain.getInternetCredentials('retail-app-refresh');
      
      return {
        access_token: accessCreds ? accessCreds.password : null,
        refresh_token: refreshCreds ? refreshCreds.password : null
      };
    } catch (error) {
      return { access_token: null, refresh_token: null };
    }
  },

  async clearTokens() {
    await Keychain.resetInternetCredentials('retail-app-tokens');
    await Keychain.resetInternetCredentials('retail-app-refresh');
  }
};

// notification.js - Push notification integration
import PushNotification from 'react-native-push-notification';

export const setupPushNotifications = (api) => {
  PushNotification.configure({
    onNotification: function(notification) {
      // Handle push notification
      console.log('Push notification:', notification);
    },
    requestPermissions: Platform.OS === 'ios'
  });

  // Connect to real-time stream
  api.connectToNotifications(
    (notification) => {
      // Show local notification for real-time events
      if (notification.type !== 'connection') {
        PushNotification.localNotification({
          title: notification.title || 'RetailAI Update',
          message: notification.message,
          data: notification.data
        });
      }
    },
    (connected) => {
      console.log('Real-time connection:', connected);
    }
  );
};
```

### Flutter/Dart Implementation

```dart
// retail_api.dart
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class RetailAPI {
  final String baseUrl;
  final FlutterSecureStorage storage = FlutterSecureStorage();
  String? accessToken;
  String? refreshToken;

  RetailAPI(this.baseUrl);

  Future<Map<String, String>> _getAuthHeaders() async {
    await _ensureValidToken();
    
    return {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    };
  }

  Future<void> _ensureValidToken() async {
    // Load tokens from secure storage
    accessToken ??= await storage.read(key: 'access_token');
    refreshToken ??= await storage.read(key: 'refresh_token');
    
    // Check if token needs refresh and refresh if needed
    if (_tokenNeedsRefresh() && refreshToken != null) {
      await _refreshTokens();
    }
  }

  Future<void> _refreshTokens() async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refresh_token': refreshToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _setTokens(data['access_token'], data['refresh_token']);
    } else {
      throw Exception('Token refresh failed');
    }
  }

  Future<void> _setTokens(String access, String? refresh) async {
    accessToken = access;
    refreshToken = refresh;
    
    await storage.write(key: 'access_token', value: access);
    if (refresh != null) {
      await storage.write(key: 'refresh_token', value: refresh);
    }
  }

  Future<dynamic> _request(String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final headers = await _getAuthHeaders();
    final uri = Uri.parse('$baseUrl$endpoint');
    final finalUri = queryParams != null ? 
      uri.replace(queryParameters: queryParams) : uri;

    http.Response response;
    
    switch (method) {
      case 'POST':
        response = await http.post(
          finalUri, 
          headers: headers, 
          body: body != null ? jsonEncode(body) : null
        );
        break;
      case 'PUT':
        response = await http.put(
          finalUri, 
          headers: headers, 
          body: body != null ? jsonEncode(body) : null
        );
        break;
      case 'DELETE':
        response = await http.delete(finalUri, headers: headers);
        break;
      default:
        response = await http.get(finalUri, headers: headers);
    }

    final data = jsonDecode(response.body);
    
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'HTTP ${response.statusCode}');
    }
    
    return data;
  }

  // Authentication
  Future<Map<String, dynamic>> signIn(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(response.body);
    
    if (response.statusCode != 200) {
      throw Exception(data['error'] ?? 'Sign in failed');
    }

    await _setTokens(data['access_token'], data['refresh_token']);
    return data;
  }

  Future<List<dynamic>> getProducts([Map<String, String>? filters]) async {
    return await _request('/products', queryParams: filters);
  }

  Future<dynamic> createProduct(Map<String, dynamic> product) async {
    return await _request('/products', method: 'POST', body: product);
  }

  // Add other business methods...
}

// Usage in Flutter
class ProductService {
  final RetailAPI api;
  
  ProductService(this.api);

  Future<List<Product>> fetchProducts() async {
    try {
      final data = await api.getProducts();
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (error) {
      throw Exception('Failed to fetch products: $error');
    }
  }
}
```

---

## Development Setup

### Prerequisites
- Node.js 18+
- Supabase CLI
- Git

### Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Local Development

1. **Clone Repository**
```bash
git clone <repository-url>
cd retail-ai-manager
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set Up Database**
```bash
# Initialize Supabase
supabase init

# Run migrations
supabase db reset

# Or apply specific migrations
supabase migration up
```

4. **Deploy Edge Functions**
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy auth
supabase functions deploy products
supabase functions deploy notifications
```

5. **Start Development Server**
```bash
npm run dev
```

### Testing APIs

#### Test Authentication
```bash
# Sign up
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  https://your-project.supabase.co/functions/v1/auth/signup

# Sign in
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  https://your-project.supabase.co/functions/v1/auth/login
```

#### Test Business Endpoints
```bash
# Get products (requires token from sign in)
curl -X GET \
  -H "Authorization: Bearer <token>" \
  https://your-project.supabase.co/functions/v1/products

# Create product
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","sku":"TEST-001","category":"Test","price":29.99,"stock":10,"min_stock":2,"location_id":"<location_id>"}' \
  https://your-project.supabase.co/functions/v1/products
```

#### Test Real-time Notifications
```bash
# Connect to SSE stream
curl -X GET \
  -H "Authorization: Bearer <token>" \
  -H "Accept: text/event-stream" \
  -H "Cache-Control: no-cache" \
  https://your-project.supabase.co/functions/v1/notifications/stream

# Send notification (in another terminal)
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"alert","title":"Test Alert","message":"This is a test notification"}' \
  https://your-project.supabase.co/functions/v1/notifications/send
```

---

## Deployment

### Production Deployment

1. **Deploy to Supabase**
```bash
# Set production environment
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy

# Apply migrations
supabase db push
```

2. **Environment Configuration**
Set production environment variables in Supabase dashboard:
- `GEMINI_API_KEY` - For AI functionality
- Any other custom environment variables

3. **Frontend Deployment**
Deploy to Vercel, Netlify, or any static hosting service with environment variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_GEMINI_API_KEY=your-production-gemini-key
```

### Monitoring and Logging

1. **Supabase Dashboard**: Monitor function performance and database metrics
2. **Error Tracking**: Implement Sentry or similar for production error monitoring
3. **Analytics**: Use Supabase Analytics for API usage insights
4. **Alerts**: Set up monitoring for critical Edge Functions
5. **Real-time Monitoring**: Monitor SSE connection health and notification delivery

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Connection Pooling**: Supabase handles this automatically
3. **Caching**: Implement client-side caching for mobile apps
4. **Pagination**: Use provided pagination parameters for large datasets
5. **Compression**: Enable gzip compression for API responses

---

## Security Considerations

### Authentication & Authorization
- All endpoints require valid JWT tokens (except auth endpoints)
- Row Level Security (RLS) enabled on all tables
- User data isolation through `user_id` checks
- Automatic token refresh prevents session hijacking
- Secure token storage requirements for mobile apps

### Data Protection
- Input validation on all endpoints
- SQL injection protection through parameterized queries
- Rate limiting to prevent abuse
- CORS configuration for web security
- Sensitive data encryption in transit and at rest

### API Security Best Practices
1. **Never expose service role keys** in client applications
2. **Use environment variables** for all sensitive configuration
3. **Implement request logging** for audit trails
4. **Regular security audits** of Edge Functions
5. **Keep dependencies updated** for security patches
6. **Use HTTPS** exclusively in production
7. **Implement proper error handling** without exposing sensitive information

### Mobile Security
1. **Secure token storage** using Keychain (iOS) / KeyStore (Android)
2. **Certificate pinning** for API requests
3. **App Transport Security** configuration
4. **Obfuscation** of API endpoints in production builds
5. **Runtime application self-protection (RASP)** for sensitive operations

---

## API Versioning

Current API version: **v1**

All endpoints are currently at version 1. Future versions will be accessible via:
```
/functions/v2/...
```

Breaking changes will increment the major version number while maintaining backward compatibility for existing versions.

### Version Management
- **Semantic Versioning**: Major.Minor.Patch format
- **Backward Compatibility**: v1 endpoints remain available
- **Deprecation Policy**: 6-month notice before version retirement
- **Migration Guides**: Provided for major version updates

---

## Support and Documentation

### Additional Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Design Patterns](https://supabase.com/docs/guides/database)
- [Real-time Features](https://supabase.com/docs/guides/realtime)

### API Status Page
Monitor API health and uptime at your Supabase dashboard under the monitoring section.

### Getting Help
1. Check this documentation first
2. Review error messages and logs in Supabase dashboard
3. Test endpoints with curl or Postman using provided examples
4. Check authentication token validity and refresh if needed
5. Verify proper CORS configuration for web applications
6. Contact development team for integration support

### Change Log
- **v1.0.0** - Initial API release with complete authentication and business logic
- **v1.1.0** - Added real-time notifications via Server-Sent Events
- **v1.2.0** - Enhanced analytics with predictive features
- **v1.3.0** - Added inventory adjustments and sales returns
- **v1.4.0** - AI-powered insights and report generation

---

This documentation provides a comprehensive reference for integrating with the RetailAI Manager API. The system is designed to be scalable, secure, and mobile-ready, with a consistent API surface that enables seamless synchronization between web and mobile applications.

**The API is now 100% ready for mobile app development with complete feature parity between web and mobile platforms.**