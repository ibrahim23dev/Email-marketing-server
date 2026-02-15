# Email Marketing Server - Complete API Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Base URLs](#base-urls)
3. [Authentication & Authorization](#authentication--authorization)
4. [OTP Verification System](#otp-verification-system)
5. [Auth API](#auth-api)
6. [Campaigns API](#campaigns-api)
7. [Subscribers API](#subscribers-api)
8. [Audiences API](#audiences-api)
9. [Templates API](#templates-api)
10. [Tags API](#tags-api)
11. [Analytics API](#analytics-api)
12. [Dashboard API](#dashboard-api)
13. [Settings API](#settings-api)
14. [User Management API](#user-management-api)
15. [Audit Logs API](#audit-logs-api)
16. [Scrape API](#scrape-api)
17. [Frontend Integration Guidelines](#frontend-integration-guidelines)
18. [Error Codes](#error-codes)
19. [Webhooks](#webhooks)

---

## Introduction

This is a comprehensive API documentation for the Email Marketing Server. The API allows you to manage email campaigns, subscribers, audiences, and analytics. All endpoints follow RESTful conventions.

### Current Version
- **API Version:** v1
- **Server Status:** Running on `http://localhost:3000`

---

## Base URLs

```
Production: https://your-domain.com/api/v1
Development: http://localhost:3000/api/v1
```

**Note:** Some endpoints use `/api` instead of `/api/v1` (legacy routes). Use the routes as specified in each section.

---

## Authentication & Authorization

### Getting a JWT Token
All protected routes require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Response (After Login)
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": false,
    "trialEndsAt": "2026-03-15T09:22:49.823Z"
  }
}
```

### Token Expiration
- JWT tokens expire after 7 days
- Include the token in all protected API requests

---

## OTP Verification System

### How OTP Works

The system uses OTP (One-Time Password) for:
1. **Email Verification** - Verify user's email after registration
2. **Password Reset** - Reset password when user forgets it

### OTP Flow

#### Registration Flow (with OTP)
```
1. User submits registration form
   ↓
2. Server creates user (unverified)
   ↓
3. Server generates 6-digit OTP
   ↓
4. OTP sent to user's email
   ↓
5. User enters OTP to verify email
   ↓
6. Email verified successfully
```

#### Password Reset Flow
```
1. User clicks "Forgot Password"
   ↓
2. User enters email address
   ↓
3. Server generates OTP
   ↓
4. OTP sent to user's email
   ↓
5. User enters OTP + new password
   ↓
6. Password reset successfully
```

### OTP Details
- **Format:** 6-character alphanumeric (e.g., "A1B2C3")
- **Validity:** 
  - Email Verification: 24 hours
  - Password Reset: 1 hour
- **Delivery:** Sent via email (currently logged to console in development)

---

## Auth API

### Base Endpoint: `/api/v1/auth`

---

### 1. Register

Create a new user account. After registration, an OTP is sent to the user's email for verification.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name (min 2 chars) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 chars) |

**Response (201 - Created):**
```json
{
  "ok": true,
  "message": "Registration successful. Please verify your email.",
  "userId": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**
- 400: Email already registered
- 500: Registration failed

**Frontend Implementation:**
```javascript
// Example registration call
async function register(name, email, password) {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await response.json();
  
  if (data.ok) {
    // Redirect to OTP verification page
    window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
  }
  return data;
}
```

---

### 2. Verify Email

Verify user's email with OTP sent during registration.

**Endpoint:** `POST /api/v1/auth/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "A1B2C3"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| otp | string | Yes | 6-character OTP code |

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
- 400: Invalid or expired OTP
- 400: OTP has expired

**Frontend Implementation:**
```javascript
// Example email verification call
async function verifyEmail(email, otp) {
  const response = await fetch('/api/v1/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await response.json();
  
  if (data.ok) {
    // Show success message and redirect to login
    alert('Email verified successfully! Please login.');
    window.location.href = '/login';
  }
  return data;
}
```

---

### 3. Resend Verification OTP

Resend the verification OTP if the previous one expired or wasn't received.

**Endpoint:** `POST /api/v1/auth/resend-verification`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Verification OTP sent"
}
```

**Error Responses:**
- 404: User not found
- 400: Email already verified

**Frontend Implementation:**
```javascript
// Example resend OTP call
async function resendVerificationOTP(email) {
  const response = await fetch('/api/v1/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return await response.json();
}
```

---

### 4. Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address |
| password | string | Yes | User's password |

**Response (200 - Success):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": false,
    "trialEndsAt": "2026-03-15T09:22:49.823Z"
  }
}
```

**Error Responses:**
- 401: Invalid credentials
- 403: Account is disabled
- 403: Free trial expired (includes `trialExpired: true` flag)

**Frontend Implementation:**
```javascript
// Example login call with token storage
async function login(email, password) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  if (data.ok && data.token) {
    // Store token securely
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}
```

---

### 5. Forgot Password

Request a password reset OTP. This endpoint always returns success for security reasons (doesn't reveal if email exists).

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address |

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "If the email exists, a reset link has been sent"
}
```

**Frontend Implementation:**
```javascript
// Example forgot password call
async function forgotPassword(email) {
  const response = await fetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  
  // Always show this message for security
  alert('If the email exists, a reset link has been sent');
  return data;
}
```

---

### 6. Reset Password

Reset password using OTP sent to user's email.

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "A1B2C3",
  "newPassword": "newSecurePassword456"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| otp | string | Yes | 6-character OTP code |
| newPassword | string | Yes | New password (min 6 chars) |

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
- 400: Invalid or expired OTP
- 400: OTP has expired

**Frontend Implementation:**
```javascript
// Example reset password call
async function resetPassword(email, otp, newPassword) {
  const response = await fetch('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword })
  });
  const data = await response.json();
  
  if (data.ok) {
    alert('Password reset successfully! Please login with your new password.');
    window.location.href = '/login';
  }
  return data;
}
```

---

### 7. Get Current User

Get authenticated user's profile information.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "isEmailVerified": true,
    "trialEndsAt": "2026-03-15T09:22:49.823Z",
    "lastLoginAt": "2026-02-15T08:00:00.000Z",
    "avatar": null,
    "phone": "+1234567890",
    "company": "Acme Inc",
    "timezone": "UTC",
    "settings": {
      "notifications": {
        "email": true,
        "push": true
      },
      "security": {
        "twoFactorEnabled": false
      }
    }
  }
}
```

**Error Responses:**
- 401: Unauthorized (invalid/missing token)
- 404: User not found

---

### 8. Change Password

Change password for authenticated user (requires current password).

**Endpoint:** `POST /api/v1/auth/change-password`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | User's current password |
| newPassword | string | Yes | New password (min 6 chars) |

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- 401: Current password is incorrect
- 500: Password change failed

---

### 9. Logout

Logout and invalidate session.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Logged out successfully"
}
```

**Frontend Implementation:**
```javascript
// Example logout call
async function logout() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Clear stored data regardless of response
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
  
  return await response.json();
}
```

---

## Campaigns API

### Base Endpoint: `/api/v1/campaigns`

All campaigns endpoints require authentication.

---

### 1. Get All Campaigns

Retrieve paginated list of campaigns.

**Endpoint:** `GET /api/v1/campaigns`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| page | number | No | Page number | 1 |
| limit | number | No | Items per page (max 100) | 20 |
| search | string | No | Search in name/subject | - |
| status | string | No | Filter by status (draft, scheduled, sending, sent, paused, failed) | - |
| type | string | No | Filter by type (newsletter, promotional, transactional, welcome) | - |
| sortBy | string | No | Sort field | createdAt |
| sortOrder | string | No | Sort direction (asc/desc) | desc |

**Example Request:**
```
GET /api/v1/campaigns?page=1&limit=10&status=draft&sortBy=createdAt&sortOrder=desc
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Welcome Campaign",
      "subject": "Welcome to our newsletter!",
      "status": "draft",
      "type": "newsletter",
      "provider": "sendgrid",
      "audienceId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "All Subscribers"
      },
      "templateId": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Welcome Template"
      },
      "stats": {
        "sent": 0,
        "delivered": 0,
        "opened": 0,
        "clicked": 0,
        "bounced": 0,
        "unsubscribed": 0,
        "complained": 0
      },
      "tags": ["welcome", "newsletter"],
      "createdAt": "2026-02-15T09:22:49.823Z",
      "updatedAt": "2026-02-15T09:22:49.823Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Get Campaign By ID

Retrieve a single campaign by ID.

**Endpoint:** `GET /api/v1/campaigns/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Welcome Campaign",
    "subject": "Welcome to our newsletter!",
    "body": "<html><body><h1>Welcome!</h1></body></html>",
    "status": "draft",
    "type": "newsletter",
    "provider": "sendgrid",
    "audienceId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "All Subscribers",
      "subscriberCount": 1000
    },
    "templateId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Welcome Template",
      "subject": "Welcome!",
      "body": "<html>...</html>"
    },
    "settings": {
      "trackOpens": true,
      "trackClicks": true,
      "unsubscribeLink": true,
      "replyTo": null
    },
    "tags": ["welcome"],
    "scheduledAt": null,
    "sentAt": null,
    "createdAt": "2026-02-15T09:22:49.823Z",
    "updatedAt": "2026-02-15T09:22:49.823Z"
  }
}
```

---

### 3. Create Campaign

Create a new email campaign.

**Endpoint:** `POST /api/v1/campaigns`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Sale Campaign",
  "subject": "🔥 Don't Miss Our Summer Sale!",
  "body": "<html><body><h1>Summer Sale</h1><p>Up to 50% off!</p></body></html>",
  "type": "promotional",
  "provider": "sendgrid",
  "audienceId": "507f1f77bcf86cd799439012",
  "templateId": "507f1f77bcf86cd799439013",
  "tags": ["sale", "summer"],
  "scheduledAt": "2026-06-01T09:00:00.000Z",
  "settings": {
    "trackOpens": true,
    "trackClicks": true,
    "unsubscribeLink": true,
    "replyTo": "support@example.com"
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Campaign name |
| subject | string | Yes | Email subject line |
| body | string | No | HTML email body |
| type | string | Yes | newsletter/promotional/transactional/welcome |
| provider | string | Yes | Email provider (sendgrid/mailgun/aws-ses) |
| audienceId | string | Yes | Target audience ID |
| templateId | string | No | Template ID to use |
| tags | array | No | Array of tag strings |
| scheduledAt | string | No | ISO date for scheduled sending |
| settings | object | No | Campaign settings |

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Summer Sale Campaign",
    "subject": "🔥 Don't Miss Our Summer Sale!",
    "status": "scheduled",
    "type": "promotional",
    "provider": "sendgrid",
    "audienceId": "507f1f77bcf86cd799439012",
    "templateId": "507f1f77bcf86cd799439013",
    "stats": {
      "sent": 0,
      "delivered": 0,
      "opened": 0,
      "clicked": 0,
      "bounced": 0,
      "unsubscribed": 0,
      "complained": 0
    },
    "tags": ["sale", "summer"],
    "scheduledAt": "2026-06-01T09:00:00.000Z",
    "createdAt": "2026-02-15T09:22:49.823Z",
    "updatedAt": "2026-02-15T09:22:49.823Z"
  },
  "message": "Campaign created successfully"
}
```

---

### 4. Update Campaign

Update an existing campaign.

**Endpoint:** `PUT /api/v1/campaigns/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Summer Sale Campaign",
  "subject": "🎉 Summer Sale - Extra 10% Off!",
  "body": "<html><body><h1>Summer Sale</h1><p>Extra 10% off!</p></body></html>"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Summer Sale Campaign",
    "subject": "🎉 Summer Sale - Extra 10% Off!",
    "status": "draft",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  "message": "Campaign updated successfully"
}
```

---

### 5. Delete Campaign

Delete a campaign.

**Endpoint:** `DELETE /api/v1/campaigns/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Campaign deleted successfully"
}
```

---

### 6. Validate Campaign

Validate campaign before sending.

**Endpoint:** `GET /api/v1/campaigns/validate`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| audienceId | string | Yes | Audience ID to validate |
| templateId | string | No | Template ID to validate |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": ["No template selected - using default"]
  }
}
```

---

### 7. Send Campaign

Start sending a campaign immediately.

**Endpoint:** `POST /api/v1/campaigns/:id/send`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Campaign sending started",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011"
  }
}
```

---

### 8. Schedule Campaign

Schedule a campaign for future sending.

**Endpoint:** `POST /api/v1/campaigns/:id/schedule`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "scheduledAt": "2026-06-01T09:00:00.000Z"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Campaign scheduled successfully",
  "data": {
    "scheduledAt": "2026-06-01T09:00:00.000Z"
  }
}
```

---

### 9. Pause Campaign

Pause a sending campaign.

**Endpoint:** `POST /api/v1/campaigns/:id/pause`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Campaign paused successfully"
}
```

---

### 10. Resume Campaign

Resume a paused campaign.

**Endpoint:** `POST /api/v1/campaigns/:id/resume`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Campaign resumed successfully"
}
```

---

### 11. Duplicate Campaign

Create a copy of an existing campaign.

**Endpoint:** `POST /api/v1/campaigns/:id/duplicate`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Welcome Campaign (Copy)",
    "status": "draft"
  },
  "message": "Campaign duplicated successfully"
}
```

---

### 12. Get Campaign Analytics

Get detailed analytics for a specific campaign.

**Endpoint:** `GET /api/v1/campaigns/:id/analytics`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "stats": {
      "sent": 1000,
      "delivered": 980,
      "opened": 450,
      "clicked": 120,
      "bounced": 20,
      "unsubscribed": 5,
      "complained": 2
    },
    "rates": {
      "deliveryRate": 98.0,
      "openRate": 45.9,
      "clickRate": 12.2,
      "bounceRate": 2.0,
      "unsubscribeRate": 0.5
    }
  }
}
```

---

## Subscribers API

### Base Endpoint: `/api/subscribers`

All subscribers endpoints require authentication.

---

### 1. Get All Subscribers

Retrieve paginated list of subscribers.

**Endpoint:** `GET /api/subscribers`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| page | number | No | Page number | 1 |
| limit | number | No | Items per page | 20 |
| search | string | No | Search in email/name | - |
| status | string | No | Filter by status (active/unsubscribed/cleaned) | - |
| audienceId | string | No | Filter by audience | - |
| tag | string | No | Filter by tag | - |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active",
      "tags": ["vip", "newsletter"],
      "audiences": ["507f1f77bcf86cd799439012"],
      "createdAt": "2026-02-15T09:22:49.823Z",
      "updatedAt": "2026-02-15T09:22:49.823Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Get Subscriber By ID

Retrieve a single subscriber by ID.

**Endpoint:** `GET /api/subscribers/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "status": "active",
    "tags": ["vip"],
    "audiences": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "All Subscribers"
      }
    ],
    "customFields": {
      "company": "Acme Inc",
      "position": "Developer"
    },
    "createdAt": "2026-02-15T09:22:49.823Z",
    "updatedAt": "2026-02-15T09:22:49.823Z"
  }
}
```

---

### 3. Create Subscriber

Create a new subscriber.

**Endpoint:** `POST /api/subscribers`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "tags": ["newsletter"],
  "audienceId": "507f1f77bcf86cd799439012",
  "customFields": {
    "company": "Acme Inc",
    "position": "Developer"
  }
}
```

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "tags": ["newsletter"],
    "createdAt": "2026-02-15T09:22:49.823Z"
  },
  "message": "Subscriber created successfully"
}
```

---

### 4. Bulk Create Subscribers

Create multiple subscribers at once.

**Endpoint:** `POST /api/subscribers/bulk`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscribers": [
    {
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ],
  "audienceId": "507f1f77bcf86cd799439012",
  "tags": ["bulk-import"]
}
```

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "created": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

### 5. Update Subscriber

Update an existing subscriber.

**Endpoint:** `PUT /api/subscribers/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "tags": ["vip", "newsletter", "updated"]
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John Updated",
    "tags": ["vip", "newsletter", "updated"]
  },
  "message": "Subscriber updated successfully"
}
```

---

### 6. Delete Subscriber

Delete a subscriber.

**Endpoint:** `DELETE /api/subscribers/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Subscriber deleted successfully"
}
```

---

### 7. Unsubscribe

Unsubscribe a subscriber from all emails.

**Endpoint:** `POST /api/subscribers/:id/unsubscribe`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "No longer interested"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Subscriber unsubscribed successfully"
}
```

---

### 8. Get Subscriber Stats

Get subscriber statistics.

**Endpoint:** `GET /api/subscribers/stats`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "total": 1000,
    "active": 850,
    "unsubscribed": 100,
    "cleaned": 50,
    "byTag": {
      "vip": 50,
      "newsletter": 600,
      "promotional": 300
    },
    "byAudience": {
      "507f1f77bcf86cd799439012": 700,
      "507f1f77bcf86cd799439013": 300
    }
  }
}
```

---

## Audiences API

### Base Endpoint: `/api/v1/audiences`

All audiences endpoints require authentication.

---

### 1. Get All Audiences

Retrieve paginated list of audiences.

**Endpoint:** `GET /api/v1/audiences`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| page | number | No | Page number | 1 |
| limit | number | No | Items per page | 20 |
| search | string | No | Search in name | - |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "All Subscribers",
      "description": "Default audience for all subscribers",
      "subscriberCount": 1000,
      "tags": ["all"],
      "createdAt": "2026-02-15T09:22:49.823Z",
      "updatedAt": "2026-02-15T09:22:49.823Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 2. Get Audience By ID

Retrieve a single audience by ID.

**Endpoint:** `GET /api/v1/audiences/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "All Subscribers",
    "description": "Default audience for all subscribers",
    "subscriberCount": 1000,
    "tags": ["all"],
    "conditions": [
      {
        "field": "status",
        "operator": "equals",
        "value": "active"
      }
    ],
    "createdAt": "2026-02-15T09:22:49.823Z",
    "updatedAt": "2026-02-15T09:22:49.823Z"
  }
}
```

---

### 3. Create Audience

Create a new audience.

**Endpoint:** `POST /api/v1/audiences`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "VIP Customers",
  "description": "High-value customers",
  "tags": ["vip", "customers"],
  "conditions": [
    {
      "field": "totalPurchases",
      "operator": "greater_than",
      "value": 1000
    }
  ]
}
```

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "VIP Customers",
    "description": "High-value customers",
    "subscriberCount": 0,
    "tags": ["vip", "customers"],
    "createdAt": "2026-02-15T09:22:49.823Z"
  },
  "message": "Audience created successfully"
}
```

---

### 4. Update Audience

Update an existing audience.

**Endpoint:** `PUT /api/v1/audiences/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "VIP Customers - Updated",
  "description": "Updated description"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Audience updated successfully"
}
```

---

### 5. Delete Audience

Delete an audience.

**Endpoint:** `DELETE /api/v1/audiences/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Audience deleted successfully"
}
```

---

### 6. Add Subscribers to Audience

Add subscribers to an audience.

**Endpoint:** `POST /api/v1/audiences/:id/subscribers`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscriberIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "2 subscribers added to audience"
}
```

---

### 7. Sync Audience Subscribers

Sync audience with conditions.

**Endpoint:** `POST /api/v1/audiences/:id/sync`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Audience synced successfully",
  "data": {
    "added": 10,
    "removed": 5
  }
}
```

---

## Templates API

### Base Endpoint: `/api/v1/templates`

All templates endpoints require authentication.

---

### 1. Get All Templates

Retrieve paginated list of templates.

**Endpoint:** `GET /api/v1/templates`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| page | number | No | Page number | 1 |
| limit | number | No | Items per page | 20 |
| search | string | No | Search in name/subject | - |
| category | string | No | Filter by category | - |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Welcome Template",
      "subject": "Welcome, {{firstName}}!",
      "category": "welcome",
      "thumbnail": "https://example.com/thumbnails/welcome.jpg",
      "createdAt": "2026-02-15T09:22:49.823Z",
      "updatedAt": "2026-02-15T09:22:49.823Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Get Template By ID

Retrieve a single template by ID.

**Endpoint:** `GET /api/v1/templates/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Welcome Template",
    "subject": "Welcome, {{firstName}}!",
    "body": "<html><body><h1>Welcome {{firstName}}!</h1></body></html>",
    "category": "welcome",
    "thumbnail": "https://example.com/thumbnails/welcome.jpg",
    "variables": ["firstName", "lastName", "company"],
    "createdAt": "2026-02-15T09:22:49.823Z",
    "updatedAt": "2026-02-15T09:22:49.823Z"
  }
}
```

---

### 3. Create Template

Create a new template.

**Endpoint:** `POST /api/v1/templates`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Sale Template",
  "subject": "🔥 Summer Sale - {{discount}}% Off!",
  "body": "<html><body><h1>Summer Sale!</h1><p>Get {{discount}}% off!</p></body></html>",
  "category": "promotional",
  "thumbnail": "https://example.com/thumbnails/summer.jpg",
  "variables": ["discount", "firstName"]
}
```

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Summer Sale Template",
    "subject": "🔥 Summer Sale - {{discount}}% Off!",
    "category": "promotional",
    "createdAt": "2026-02-15T09:22:49.823Z"
  },
  "message": "Template created successfully"
}
```

---

### 4. Update Template

Update an existing template.

**Endpoint:** `PUT /api/v1/templates/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Summer Sale Template",
  "subject": "🎉 Extra {{extraDiscount}}% Off!"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Template updated successfully"
}
```

---

### 5. Delete Template

Delete a template.

**Endpoint:** `DELETE /api/v1/templates/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Template deleted successfully"
}
```

---

## Tags API

### Base Endpoint: `/api/tags`

All tags endpoints require authentication.

---

### 1. Get All Tags

Retrieve all tags.

**Endpoint:** `GET /api/tags`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "newsletter",
      "subscriberCount": 500,
      "color": "#3498db",
      "createdAt": "2026-02-15T09:22:49.823Z"
    }
  ]
}
```

---

### 2. Get Tag By ID

Retrieve a single tag by ID.

**Endpoint:** `GET /api/tags/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "newsletter",
    "subscriberCount": 500,
    "color": "#3498db"
  }
}
```

---

### 3. Create Tag

Create a new tag.

**Endpoint:** `POST /api/tags`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "vip",
  "color": "#e74c3c"
}
```

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "vip",
    "color": "#e74c3c",
    "subscriberCount": 0,
    "createdAt": "2026-02-15T09:22:49.823Z"
  },
  "message": "Tag created successfully"
}
```

---

### 4. Update Tag

Update an existing tag.

**Endpoint:** `PUT /api/tags/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "vip-updated",
  "color": "#9b59b6"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Tag updated successfully"
}
```

---

### 5. Delete Tag

Delete a tag.

**Endpoint:** `DELETE /api/tags/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Tag deleted successfully"
}
```

---

### 6. Merge Tags

Merge multiple tags into one.

**Endpoint:** `POST /api/tags/merge`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sourceTagIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "targetTagId": "507f1f77bcf86cd799439013"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Tags merged successfully",
  "data": {
    "mergedCount": 50
  }
}
```

---

## Analytics API

### Base Endpoint: `/api/analytics`

All analytics endpoints require authentication.

---

### 1. Get Overall Analytics

Get overall email campaign analytics.

**Endpoint:** `GET /api/analytics`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO) |
| endDate | string | No | End date (ISO) |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "overview": {
      "totalCampaigns": 50,
      "totalSent": 50000,
      "totalDelivered": 49000,
      "totalOpened": 20000,
      "totalClicked": 8000,
      "totalBounced": 1000,
      "totalUnsubscribed": 200
    },
    "rates": {
      "deliveryRate": 98.0,
      "openRate": 40.8,
      "clickRate": 16.3,
      "bounceRate": 2.0,
      "unsubscribeRate": 0.4
    }
  }
}
```

---

### 2. Get Analytics By Campaign

Get analytics for a specific campaign.

**Endpoint:**/analytics/campaign `GET /api/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "campaignName": "Summer Sale",
    "stats": {
      "sent": 10000,
      "delivered": 9800,
      "opened": 4500,
      "clicked": 1500,
      "bounced": 200,
      "unsubscribed": 50
    }
  }
}
```

---

### 3. Get Time Series Analytics

Get analytics over time.

**Endpoint:** `GET /api/analytics/timeseries`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (ISO) |
| endDate | string | Yes | End date (ISO) |
| interval | string | No | daily/weekly/monthly |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "date": "2026-02-01",
      "sent": 1000,
      "delivered": 980,
      "opened": 400,
      "clicked": 100,
      "bounced": 20
    }
  ]
}
```

---

### 4. Get Top Campaigns

Get top performing campaigns.

**Endpoint:** `GET /api/analytics/top-campaigns`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of campaigns (default 10) |
| sortBy | string | No | opens/clicks/conversions |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Welcome Campaign",
      "sent": 10000,
      "opened": 5000,
      "clicked": 2000,
      "openRate": 50.0,
      "clickRate": 20.0
    }
  ]
}
```

---

### 5. Get Engagement Metrics

Get engagement metrics.

**Endpoint:** `GET /api/analytics/engagement`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "activeSubscribers": 850,
    "engagedLast30Days": 600,
    "engagedLast90Days": 750,
    "churnRate": 2.5,
    "reEngagementRate": 5.0
  }
}
```

---

## Dashboard API

### Base Endpoint: `/api/dashboard`

All dashboard endpoints require authentication.

---

### 1. Get Dashboard

Get dashboard overview.

**Endpoint:** `GET /api/dashboard`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "overview": {
      "totalSubscribers": 1000,
      "totalCampaigns": 50,
      "totalAudiences": 10,
      "sentThisMonth": 5000
    },
    "recentCampaigns": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Summer Sale",
        "status": "sent",
        "sent": 1000,
        "opened": 400
      }
    ],
    "recentActivity": [
      {
        "action": "Campaign sent",
        "campaign": "Summer Sale",
        "timestamp": "2026-02-15T09:22:49.823Z"
      }
    ]
  }
}
```

---

### 2. Get Campaign Performance

Get campaign performance metrics.

**Endpoint:** `GET /api/dashboard/campaigns`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of campaigns |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Summer Sale",
      "type": "promotional",
      "sent": 1000,
      "delivered": 980,
      "opened": 400,
      "clicked": 100,
      "bounced": 20
    }
  ]
}
```

---

### 3. Get Subscriber Analytics

Get subscriber analytics.

**Endpoint:** `GET /api/dashboard/subscribers`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "total": 1000,
    "growth": {
      "thisMonth": 50,
      "lastMonth": 30,
      "percentage": 66.7
    },
    "byStatus": {
      "active": 850,
      "unsubscribed": 100,
      "cleaned": 50
    }
  }
}
```

---

## Settings API

### Base Endpoint: `/api/settings`

All settings endpoints require authentication.

---

### 1. Get Profile

Get user profile.

**Endpoint:** `GET /api/settings/profile`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Inc",
    "timezone": "UTC",
    "avatar": "https://example.com/avatars/john.jpg"
  }
}
```

---

### 2. Update Profile

Update user profile.

**Endpoint:** `PUT /api/settings/profile`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+9876543210",
  "company": "New Company",
  "timezone": "America/New_York"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Profile updated successfully"
}
```

---

### 3. Get Notification Settings

Get notification preferences.

**Endpoint:** `GET /api/settings/notifications`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "email": true,
    "push": true,
    "sms": false,
    "campaignReports": true,
    "weeklyDigest": true,
    "productUpdates": false
  }
}
```

---

### 4. Update Notification Settings

Update notification preferences.

**Endpoint:** `PUT /api/settings/notifications`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": true,
  "push": true,
  "sms": true,
  "campaignReports": true,
  "weeklyDigest": false,
  "productUpdates": true
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Notification settings updated successfully"
}
```

---

### 5. Get Security Settings

Get security settings.

**Endpoint:** `GET /api/settings/security`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "twoFactorEnabled": false,
    "lastPasswordChange": "2026-01-15T09:22:49.823Z",
    "loginHistory": [
      {
        "ip": "192.168.1.1",
        "location": "New York, US",
        "timestamp": "2026-02-15T09:22:49.823Z",
        "device": "Chrome on Windows"
      }
    ]
  }
}
```

---

### 6. Update Password

Update user password.

**Endpoint:** `PUT /api/settings/password`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Password updated successfully"
}
```

---

### 7. Update Security Settings

Update security settings.

**Endpoint:** `PUT /api/settings/security`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "twoFactorEnabled": true
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Security settings updated successfully"
}
```

---

### 8. Get All Settings

Get all user settings.

**Endpoint:** `GET /api/settings`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "profile": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "notifications": {
      "email": true,
      "push": true
    },
    "security": {
      "twoFactorEnabled": false
    }
  }
}
```

---

### 9. Update All Settings

Update all user settings at once.

**Endpoint:** `PUT /api/settings`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "profile": {
    "name": "John Updated",
    "phone": "+9876543210"
  },
  "notifications": {
    "email": true,
    "push": false
  }
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Settings updated successfully"
}
```

---

## User Management API

### Base Endpoint: `/api/users`

All user management endpoints require authentication and admin role.

---

### 1. Get All Users

Retrieve paginated list of users (Admin only).

**Endpoint:** `GET /api/users`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "isEmailVerified": true,
      "trialEndsAt": "2026-03-15T09:22:49.823Z",
      "createdAt": "2026-01-01T09:22:49.823Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 2. Get User By ID

Retrieve a single user by ID (Admin only).

**Endpoint:** `GET /api/users/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "isEmailVerified": true,
    "trialEndsAt": "2026-03-15T09:22:49.823Z",
    "lastLoginAt": "2026-02-15T09:22:49.823Z",
    "createdAt": "2026-01-01T09:22:49.823Z"
  }
}
```

---

### 3. Create User

Create a new user (Admin only).

**Endpoint:** `POST /api/users`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "user"
}
```

**Response (201 - Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user"
  },
  "message": "User created successfully"
}
```

---

### 4. Update User

Update an existing user (Admin only).

**Endpoint:** `PUT /api/users/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Updated",
  "role": "admin",
  "isActive": false
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "User updated successfully"
}
```

---

### 5. Delete User

Delete a user (Admin only).

**Endpoint:** `DELETE /api/users/:id`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "User deleted successfully"
}
```

---

### 6. Reset User Password

Reset a user's password (Admin only).

**Endpoint:** `POST /api/users/:id/reset-password`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newPassword": "newSecurePassword456"
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

---

### 7. Get User Stats

Get user statistics (Admin only).

**Endpoint:** `GET /api/users/stats`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "total": 50,
    "active": 40,
    "inactive": 5,
    "admins": 3,
    "byRole": {
      "admin": 3,
      "user": 47
    }
  }
}
```

---

## Audit Logs API

### Base Endpoint: `/api/audit-logs`

All audit log endpoints require authentication.

---

### 1. Get Audit Logs

Get all audit logs (Admin/Superadmin only).

**Endpoint:** `GET /api/audit-logs`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number |
| limit | number | No | Items per page |
| action | string | No | Filter by action |
| userId | string | No | Filter by user |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": {
        "_id": "507f1f77bcf86cd799439010",
        "name": "John Doe"
      },
      "action": "USER_LOGIN",
      "entityType": "User",
      "entityId": "507f1f77bcf86cd799439010",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-02-15T09:22:49.823Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50
  }
}
```

---

### 2. Get My Audit Logs

Get current user's audit logs.

**Endpoint:** `GET /api/audit-logs/my`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "action": "CAMPAIGN_SENT",
      "entityType": "Campaign",
      "entityId": "507f1f77bcf86cd799439015",
      "ipAddress": "192.168.1.1",
      "timestamp": "2026-02-15T09:22:49.823Z"
    }
  ]
}
```

---

### 3. Get Audit Log Stats

Get audit log statistics (Admin/Superadmin only).

**Endpoint:** `GET /api/audit-logs/stats`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "total": 1000,
    "byAction": {
      "USER_LOGIN": 500,
      "CAMPAIGN_SENT": 200,
      "SUBSCRIBER_CREATED": 300
    }
  }
}
```

---

### 4. Export Audit Logs

Export audit logs (Admin/Superadmin only).

**Endpoint:** `GET /api/audit-logs/export`

**Headers:** 
```http
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | No | csv/json |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": "exported_data..."
}
```

---

## Scrape API

### Base Endpoint: `/api/v1/scrape`

Scrape API for lead generation.

---

### 1. Start Scrape

Start a new scrape job.

**Endpoint:** `POST /api/v1/scrape/scrape`

**Request Body:**
```json
{
  "actorId": "your-actor-id",
  "input": {
    "url": "https://example.com/leads",
    "maxItems": 100
  }
}
```

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "jobId": "507f1f77bcf86cd799439011",
    "status": "started"
  }
}
```

---

### 2. List Leads

Get list of scraped leads.

**Endpoint:** `GET /api/v1/scrape/leads`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number |
| limit | number | No | Items per page |

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "lead@example.com",
      "name": "Lead Name",
      "company": "Lead Company",
      "source": "scrape",
      "createdAt": "2026-02-15T09:22:49.823Z"
    }
  ]
}
```

---

### 3. Get Lead

Get a single lead by ID.

**Endpoint:** `GET /api/v1/scrape/leads/:id`

**Response (200 - Success):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "lead@example.com",
    "name": "Lead Name",
    "company": "Lead Company",
    "phone": "+1234567890",
    "source": "scrape",
    "createdAt": "2026-02-15T09:22:49.823Z"
  }
}
```

---

## Frontend Integration Guidelines

### Authentication Flow

1. **Registration Flow**
   ```
   1. User fills registration form
   2. POST /api/v1/auth/register
   3. Receive userId in response
   4. Redirect to OTP verification page
   5. User enters OTP
   6. POST /api/v1/auth/verify-email
   7. On success, redirect to login
   8. User logs in
   9. Store JWT token securely
   ```

2. **Login Flow**
   ```
   1. User enters email/password
   2. POST /api/v1/auth/login
   3. Receive token and user data
   4. Store token (localStorage/sessionStorage)
   5. Redirect to dashboard
   ```

3. **Password Reset Flow**
   ```
   1. User clicks "Forgot Password"
   2. User enters email
   3. POST /api/v1/auth/forgot-password
   4. Show message (security)
   5. User checks email for OTP
   6. User enters OTP + new password
   7. POST /api/v1/auth/reset-password
   8. Redirect to login
   ```

### Token Management

```javascript
// Store token
localStorage.setItem('authToken', response.token);

// Get token
const token = localStorage.getItem('authToken');

// Include in requests
fetch('/api/v1/campaigns', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Clear token on logout
localStorage.removeItem('authToken');
```

### Request Wrapper Example

```javascript
class ApiClient {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  register(data) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  login(data) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  verifyEmail(data) {
    return this.request('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) });
  }

  getCurrentUser() {
    return this.request('/auth/me');
  }

  // Campaigns
  getCampaigns(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/campaigns?${query}`);
  }

  createCampaign(data) {
    return this.request('/campaigns', { method: 'POST', body: JSON.stringify(data) });
  }

  // ... other methods
}

const api = new ApiClient();
```

### OTP Input Component

```javascript
// OTP Input Component Example
function OTPInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState('');

  const handleChange = (index, value) => {
    const newOtp = otp.split('');
    newOtp[index] = value;
    const finalOtp = newOtp.join('');
    setOtp(finalOtp);

    if (finalOtp.length === length && onComplete) {
      onComplete(finalOtp);
    }
  };

  return (
    <div className="otp-input">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
        />
      ))}
    </div>
  );
}
```

### Error Handling

```javascript
// Global error handler
function handleApiError(error) {
  switch (error.message) {
    case 'Invalid credentials':
      // Show login error
      break;
    case 'Invalid or expired OTP':
      // Show OTP error, allow resend
      break;
    case 'OTP has expired':
      // Show expired message, auto-resend
      break;
    case 'Unauthorized':
      // Clear token, redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      break;
    default:
      // Show generic error
  }
}
```

### Protected Route Component

```javascript
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Verify token is still valid
    fetch('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    })
    .then(data => {
      setUser(data.user);
      setLoading(false);
    })
    .catch(() => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return children;
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Invalid or missing JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Responses

```json
{
  "error": "Invalid credentials"
}
```

```json
{
  "error": "Invalid or expired OTP"
}
```

```json
{
  "error": "Email already registered"
}
```

```json
{
  "ok": false,
  "error": "Campaign not found"
}
```

---

## Webhooks

Configure webhooks to receive real-time notifications.

### Available Webhook Events

| Event | Description |
|-------|-------------|
| campaign.sent | Campaign was sent |
| campaign.delivered | Email was delivered |
| campaign.opened | Email was opened |
| campaign.clicked | Link was clicked |
| campaign.bounced | Email bounced |
| subscriber.added | New subscriber added |
| subscriber.unsubscribed | Subscriber unsubscribed |

### Webhook Payload

```json
{
  "event": "campaign.sent",
  "timestamp": "2026-02-15T09:22:49.823Z",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "subscriberId": "507f1f77bcf86cd799439012",
    "messageId": "msg-123"
  }
}
```

---

## Rate Limits

- **Authentication endpoints:** 5 requests per minute
- **Campaign operations:** 10 requests per minute
- **Subscriber operations:** 60 requests per minute
- **Analytics:** 30 requests per minute

---

## Support

For API support, contact: support@example.com

---

*Last Updated: 2026-02-15*
