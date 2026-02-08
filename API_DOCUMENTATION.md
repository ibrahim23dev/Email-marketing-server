# Email Marketing Server - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Table of Contents
1. [Auth API](#auth-api)
2. [Campaigns API](#campaigns-api)
3. [Subscribers API](#subscribers-api)
4. [Audiences API](#audiences-api)
5. [Templates API](#templates-api)
6. [Tags API](#tags-api)
7. [Analytics API](#analytics-api)
8. [Dashboard API](#dashboard-api)
9. [Settings API](#settings-api)
10. [User Management API](#user-management-api)
11. [Audit Logs API](#audit-logs-api)
12. [Scrape API](#scrape-api)

---

## Auth API

### Register
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "ok": true,
  "message": "Registration successful. Please verify your email.",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

### Login
Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
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
    "trialEndsAt": "2026-03-08T11:40:03.000Z"
  }
}
```

---

### Verify Email
Verify user's email with OTP.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "A1B2C3"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Email verified successfully"
}
```

---

### Resend Verification OTP
Resend email verification OTP.

**Endpoint:** `POST /api/auth/resend-verification`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Verification OTP sent"
}
```

---

### Forgot Password
Request password reset OTP.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "If the email exists, a reset link has been sent"
}
```

---

### Reset Password
Reset password with OTP.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "A1B2C3",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

---

### Change Password (Protected)
Change password for authenticated user.

**Endpoint:** `POST /api/auth/change-password`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password changed successfully"
}
```

---

### Get Current User (Protected)
Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
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
    "trialEndsAt": "2026-03-08T11:40:03.000Z",
    "lastLoginAt": "2026-02-08T11:40:03.000Z",
    "avatar": null,
    "phone": "+1234567890",
    "company": "Acme Inc",
    "timezone": "UTC",
    "settings": {}
  }
}
```

---

### Logout (Protected)
Logout and invalidate session.

**Endpoint:** `POST /api/auth/logout`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Logged out successfully"
}
```

---

## Campaigns API

### Get All Campaigns
Retrieve paginated list of campaigns.

**Endpoint:** `GET /api/campaigns`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| search | string | Search in name/subject | - |
| status | string | Filter by status | - |
| type | string | Filter by type | - |
| sortBy | string | Sort field | createdAt |
| sortOrder | string | asc or desc | desc |

**Response (200):**
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
      "createdAt": "2026-02-08T11:40:03.000Z",
      "updatedAt": "2026-02-08T11:40:03.000Z"
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

### Get Campaign By ID
Retrieve a single campaign by ID.

**Endpoint:** `GET /api/campaigns/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
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
    "createdAt": "2026-02-08T11:40:03.000Z",
    "updatedAt": "2026-02-08T11:40:03.000Z"
  }
}
```

---

### Create Campaign
Create a new email campaign.

**Endpoint:** `POST /api/campaigns`
**Headers:** `Authorization: Bearer <token>`

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
  "scheduledAt": "2026-06-01T09:00:00.000Z"
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Summer Sale Campaign",
    "subject": "🔥 Don't Miss Our Summer Sale!",
    "body": "<html><body><h1>Summer Sale</h1><p>Up to 50% off!</p></body></html>",
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
    "createdAt": "2026-02-08T11:40:03.000Z",
    "updatedAt": "2026-02-08T11:40:03.000Z"
  },
  "message": "Campaign created successfully"
}
```

---

### Update Campaign
Update an existing campaign.

**Endpoint:** `PUT /api/campaigns/:id`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Summer Sale Campaign",
  "subject": "🎉 Summer Sale - Extra 10% Off!",
  "body": "<html><body><h1>Summer Sale</h1><p>Extra 10% off!</p></body></html>"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Summer Sale Campaign",
    "subject": "🎉 Summer Sale - Extra 10% Off!",
    "body": "<html><body><h1>Summer Sale</h1><p>Extra 10% off!</p></body></html>",
    "status": "draft",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  },
  "message": "Campaign updated successfully"
}
```

---

### Delete Campaign
Delete a campaign.

**Endpoint:** `DELETE /api/campaigns/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Campaign deleted successfully"
}
```

---

### Send Campaign
Start sending a campaign.

**Endpoint:** `POST /api/campaigns/:id/send`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
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

### Schedule Campaign
Schedule a campaign for future sending.

**Endpoint:** `POST /api/campaigns/:id/schedule`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "scheduledAt": "2026-06-01T09:00:00.000Z"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Campaign scheduled successfully",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011",
    "scheduledAt": "2026-06-01T09:00:00.000Z"
  }
}
```

---

### Pause Campaign
Pause a sending/scheduled campaign.

**Endpoint:** `POST /api/campaigns/:id/pause`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Campaign paused",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011"
  }
}
```

---

### Resume Campaign
Resume a paused campaign.

**Endpoint:** `POST /api/campaigns/:id/resume`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true": "Campaign resumed,
  "message",
  "data": {
    "campaignId": "507f1f77bcf86cd799439011"
  }
}
```

---

### Duplicate Campaign
Create a copy of an existing campaign.

**Endpoint:** `POST /api/campaigns/:id/duplicate`
**Headers:** `Authorization: Bearer <token>`

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Copy of Summer Sale Campaign",
    "subject": "🎉 Summer Sale - Extra 10% Off!",
    "body": "<html><body><h1>Summer Sale</h1><p>Extra 10% off!</p></body></html>",
    "status": "draft",
    "type": "promotional",
    "audienceId": "507f1f77bcf86cd799439012",
    "templateId": "507f1f77bcf86cd799439013",
    "tags": ["sale", "summer"],
    "createdAt": "2026-02-08T12:00:00.000Z"
  },
  "message": "Campaign duplicated successfully"
}
```

---

### Validate Campaign
Validate campaign data before sending.

**Endpoint:** `GET /api/campaigns/validate`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:** Same as create campaign body parameters

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "isValid": true,
    "issues": []
  }
}
```

---

### Get Campaign Analytics
Get detailed analytics for a specific campaign.

**Endpoint:** `GET /api/campaigns/:id/analytics`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "campaign": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Summer Sale Campaign",
      "subject": "🔥 Don't Miss Our Summer Sale!",
      "status": "completed",
      "createdAt": "2026-02-08T11:40:03.000Z",
      "sentAt": "2026-02-08T11:45:00.000Z"
    },
    "stats": {
      "sent": 1000,
      "delivered": 980,
      "opened": 245,
      "clicked": 98,
      "bounced": 20,
      "unsubscribed": 5,
      "complained": 0
    },
    "rates": {
      "openRate": "25.00",
      "clickRate": "40.00",
      "bounceRate": "2.00",
      "unsubscribeRate": "0.51"
    }
  }
}
```

---

## Subscribers API

### Get All Subscribers
Retrieve paginated list of subscribers.

**Endpoint:** `GET /api/subscribers`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| search | string | Search in email/firstName/lastName | - |
| status | string | Filter by status | - |
| tags | string | Comma-separated tags | - |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active",
      "tags": ["newsletter", "premium"],
      "source": "manual",
      "customFields": {
        "city": "New York",
        "company": "Acme Inc"
      },
      "stats": {
        "campaignsReceived": 10,
        "campaignsOpened": 5,
        "campaignsClicked": 2,
        "lastOpenedAt": "2026-02-07T14:30:00.000Z",
        "lastClickedAt": "2026-02-07T14:35:00.000Z"
      },
      "emailValidation": {
        "isValid": true,
        "validationDate": "2026-02-08T11:40:03.000Z"
      },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-02-08T11:40:03.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

---

### Get Subscriber By ID
Retrieve a single subscriber.

**Endpoint:** `GET /api/subscribers/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "tags": ["newsletter", "premium"],
    "source": "manual",
    "customFields": {
      "city": "New York",
      "company": "Acme Inc"
    },
    "stats": {
      "campaignsReceived": 10,
      "campaignsOpened": 5,
      "campaignsClicked": 2
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-08T11:40:03.000Z"
  }
}
```

---

### Create Subscriber
Create a new subscriber.

**Endpoint:** `POST /api/subscribers`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "tags": ["newsletter", "vip"],
  "source": "landing_page",
  "customFields": {
    "city": "Los Angeles",
    "company": "Tech Corp"
  }
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "active",
    "tags": ["newsletter", "vip"],
    "source": "landing_page",
    "customFields": {
      "city": "Los Angeles",
      "company": "Tech Corp"
    },
    "stats": {
      "campaignsReceived": 0,
      "campaignsOpened": 0,
      "campaignsClicked": 0
    },
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  },
  "message": "Subscriber created successfully"
}
```

---

### Bulk Create Subscribers
Import multiple subscribers at once.

**Endpoint:** `POST /api/subscribers/bulk`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subscribers": [
    {
      "email": "user1@example.com",
      "firstName": "User",
      "lastName": "One",
      "tags": ["newsletter"]
    },
    {
      "email": "user2@example.com",
      "firstName": "User",
      "lastName": "Two",
      "tags": ["newsletter"]
    },
    {
      "email": "user3@example.com",
      "firstName": "User",
      "lastName": "Three",
      "tags": ["promotions"]
    }
  ],
  "source": "csv_import"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "created": 2,
    "skipped": 1,
    "errors": []
  },
  "message": "Bulk import completed"
}
```

---

### Update Subscriber
Update an existing subscriber.

**Endpoint:** `PUT /api/subscribers/:id`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Jane Updated",
  "tags": ["newsletter", "vip", "premium"],
  "customFields": {
    "city": "San Francisco",
    "company": "New Tech Corp"
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "email": "jane@example.com",
    "firstName": "Jane Updated",
    "lastName": "Smith",
    "status": "active",
    "tags": ["newsletter", "vip", "premium"],
    "updatedAt": "2026-02-08T12:30:00.000Z"
  },
  "message": "Subscriber updated successfully"
}
```

---

### Delete Subscriber
Delete a subscriber.

**Endpoint:** `DELETE /api/subscribers/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Subscriber deleted successfully"
}
```

---

### Unsubscribe
Unsubscribe a subscriber from emails.

**Endpoint:** `POST /api/subscribers/:id/unsubscribe`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Unsubscribed successfully"
}
```

---

### Get Subscriber Stats
Get subscriber statistics.

**Endpoint:** `GET /api/subscribers/stats`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "total": 500,
    "active": 450,
    "unsubscribed": 30,
    "bounced": 20,
    "unsubscribeRate": "6.00"
  }
}
```

---

## Audiences API

### Get All Audiences
Retrieve paginated list of audiences.

**Endpoint:** `GET /api/audiences`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| search | string | Search in name/description | - |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439031",
      "name": "All Subscribers",
      "description": "All newsletter subscribers",
      "subscriberCount": 500,
      "tags": ["newsletter"],
      "filters": [],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-02-08T11:40:03.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### Get Audience By ID
Retrieve a single audience.

**Endpoint:** `GET /api/audiences/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "name": "All Subscribers",
    "description": "All newsletter subscribers",
    "subscriberCount": 500,
    "tags": ["newsletter"],
    "filters": [],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-08T11:40:03.000Z"
  }
}
```

---

### Create Audience
Create a new audience.

**Endpoint:** `POST /api/audiences`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Premium Subscribers",
  "description": "Premium tier subscribers",
  "tags": ["premium"],
  "filters": [
    {
      "field": "tags",
      "operator": "contains",
      "value": "premium"
    }
  ]
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439032",
    "name": "Premium Subscribers",
    "description": "Premium tier subscribers",
    "subscriberCount": 0,
    "tags": ["premium"],
    "filters": [
      {
        "field": "tags",
        "operator": "contains",
        "value": "premium"
      }
    ],
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  },
  "message": "Audience created successfully"
}
```

---

### Update Audience
Update an existing audience.

**Endpoint:** `PUT /api/audiences/:id`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "VIP Subscribers",
  "description": "VIP tier subscribers",
  "filters": [
    {
      "field": "tags",
      "operator": "contains",
      "value": "vip"
    }
  ]
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439032",
    "name": "VIP Subscribers",
    "description": "VIP tier subscribers",
    "subscriberCount": 0,
    "tags": ["vip"],
    "filters": [
      {
        "field": "tags",
        "operator": "contains",
        "value": "vip"
      }
    ],
    "updatedAt": "2026-02-08T12:30:00.000Z"
  },
  "message": "Audience updated successfully"
}
```

---

### Delete Audience
Delete an audience.

**Endpoint:** `DELETE /api/audiences/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Audience deleted successfully"
}
```

---

### Add Subscribers to Audience
Add subscribers to an audience by IDs.

**Endpoint:** `POST /api/audiences/:id/subscribers`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subscriberIds": [
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022",
    "507f1f77bcf86cd799439023"
  ]
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Subscribers added successfully",
  "subscriberCount": 503
}
```

---

### Sync Audience Subscribers
Sync audience subscriber count.

**Endpoint:** `POST /api/audiences/:id/sync`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Audience synced",
  "subscriberCount": 510
}
```

---

## Templates API

### Get All Templates
Retrieve paginated list of templates.

**Endpoint:** `GET /api/templates`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| category | string | Filter by category | - |
| search | string | Search in name/subject | - |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439041",
      "name": "Welcome Email",
      "subject": "Welcome to our newsletter!",
      "body": "<html><body><h1>Welcome {{firstName}}!</h1>...</body></html>",
      "category": "welcome",
      "thumbnail": "https://example.com/thumbnails/welcome.png",
      "isDefault": false,
      "variables": ["firstName", "lastName"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-02-08T11:40:03.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

### Get Template By ID
Retrieve a single template.

**Endpoint:** `GET /api/templates/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439041",
    "name": "Welcome Email",
    "subject": "Welcome to our newsletter!",
    "body": "<html><body><h1>Welcome {{firstName}}!</h1><p>Thank you for joining...</p></body></html>",
    "category": "welcome",
    "thumbnail": "https://example.com/thumbnails/welcome.png",
    "isDefault": false,
    "variables": ["firstName", "lastName"],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-08T11:40:03.000Z"
  }
}
```

---

### Get Default Templates
Get system default templates.

**Endpoint:** `GET /api/templates/default`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439042",
      "name": "Default Welcome",
      "subject": "Welcome!",
      "body": "<html><body>...</body></html>",
      "category": "welcome",
      "isDefault": true
    }
  ]
}
```

---

### Create Template
Create a new template.

**Endpoint:** `POST /api/templates`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Monthly Newsletter",
  "subject": "Your Monthly Update - {{month}}",
  "body": "<html><body><h1>Monthly Newsletter</h1><p>Hello {{firstName}},</p>...</body></html>",
  "category": "newsletter",
  "thumbnail": "https://example.com/thumbnails/newsletter.png",
  "isDefault": false,
  "variables": ["firstName", "month"]
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439043",
    "name": "Monthly Newsletter",
    "subject": "Your Monthly Update - {{month}}",
    "body": "<html><body><h1>Monthly Newsletter</h1><p>Hello {{firstName}},</p>...</body></html>",
    "category": "newsletter",
    "isDefault": false,
    "variables": ["firstName", "month"],
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  },
  "message": "Template created successfully"
}
```

---

### Update Template
Update an existing template.

**Endpoint:** `PUT /api/templates/:id`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Monthly Newsletter",
  "subject": "Your {{month}} Update",
  "body": "<html><body><h1>Updated Newsletter</h1>...</body></html>",
  "variables": ["firstName", "month", "year"]
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439043",
    "name": "Updated Monthly Newsletter",
    "subject": "Your {{month}} Update",
    "body": "<html><body><h1>Updated Newsletter</h1>...</body></html>",
    "variables": ["firstName", "month", "year"],
    "updatedAt": "2026-02-08T12:30:00.000Z"
  },
  "message": "Template updated successfully"
}
```

---

### Delete Template
Delete a template.

**Endpoint:** `DELETE /api/templates/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Template deleted successfully"
}
```

---

## Tags API

### Get All Tags
Retrieve all tags for the user.

**Endpoint:** `GET /api/tags`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search in name/slug |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439051",
      "name": "newsletter",
      "slug": "newsletter",
      "color": "#3498db",
      "description": "Newsletter subscribers",
      "subscriberCount": 500,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-02-08T11:40:03.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439052",
      "name": "premium",
      "slug": "premium",
      "color": "#e74c3c",
      "description": "Premium subscribers",
      "subscriberCount": 100,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-02-08T11:40:03.000Z"
    }
  ]
}
```

---

### Get Tag By ID
Retrieve a single tag.

**Endpoint:** `GET /api/tags/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439051",
    "name": "newsletter",
    "slug": "newsletter",
    "color": "#3498db",
    "description": "Newsletter subscribers",
    "subscriberCount": 500,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-08T11:40:03.000Z"
  }
}
```

---

### Create Tag
Create a new tag.

**Endpoint:** `POST /api/tags`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Summer Sale 2026",
  "color": "#2ecc71",
  "description": "Subscribers interested in summer sale"
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439053",
    "name": "Summer Sale 2026",
    "slug": "summer-sale-2026",
    "color": "#2ecc71",
    "description": "Subscribers interested in summer sale",
    "subscriberCount": 0,
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  },
  "message": "Tag created successfully"
}
```

---

### Update Tag
Update an existing tag.

**Endpoint:** `PUT /api/tags/:id`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Summer Sale",
  "color": "#27ae60",
  "description": "Summer sale subscribers"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439053",
    "name": "Summer Sale",
    "slug": "summer-sale",
    "color": "#27ae60",
    "description": "Summer sale subscribers",
    "subscriberCount": 0,
    "updatedAt": "2026-02-08T12:30:00.000Z"
  },
  "message": "Tag updated successfully"
}
```

---

### Delete Tag
Delete a tag.

**Endpoint:** `DELETE /api/tags/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "message": "Tag deleted successfully"
}
```

---

### Merge Tags
Merge multiple tags into one.

**Endpoint:** `POST /api/tags/merge`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sourceTagIds": [
    "507f1f77bcf86cd799439051",
    "507f1f77bcf86cd799439052"
  ],
  "targetTagId": "507f1f77bcf86cd799439053"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Tags merged successfully"
}
```

---

## Analytics API

### Get Overall Analytics
Get overall campaign analytics.

**Endpoint:** `GET /api/analytics`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (ISO 8601) |
| endDate | string | End date (ISO 8601) |

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "totalCampaigns": 50,
    "totals": {
      "sent": 50000,
      "delivered": 49000,
      "opened": 12250,
      "clicked": 3675,
      "bounced": 1000,
      "unsubscribed": 245,
      "complained": 10
    },
    "rates": {
      "openRate": "25.00",
      "clickRate": "30.00",
      "bounceRate": "2.00",
      "unsubscribeRate": "0.50"
    }
  }
}
```

---

### Get Campaign Analytics
Get analytics for a specific campaign.

**Endpoint:** `GET /api/analytics/campaign/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "campaign": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Summer Sale Campaign",
      "subject": "🔥 Don't Miss Our Summer Sale!",
      "status": "completed",
      "createdAt": "2026-02-08T11:40:03.000Z",
      "sentAt": "2026-02-08T11:45:00.000Z"
    },
    "stats": {
      "sent": 1000,
      "delivered": 980,
      "opened": 245,
      "clicked": 98,
      "bounced": 20,
      "unsubscribed": 5,
      "complained": 0
    },
    "rates": {
      "openRate": "25.00",
      "clickRate": "40.00",
      "bounceRate": "2.04",
      "unsubscribeRate": "0.51"
    }
  }
}
```

---

### Get Time Series Analytics
Get analytics over time.

**Endpoint:** `GET /api/analytics/timeseries`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (ISO 8601) |
| endDate | string | End date (ISO 8601) |
| granularity | string | day or week |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "2026-02-01",
      "campaigns": 2,
      "sent": 2000,
      "opened": 500,
      "clicked": 150,
      "bounced": 20,
      "unsubscribed": 5
    },
    {
      "_id": "2026-02-02",
      "campaigns": 1,
      "sent": 1000,
      "opened": 250,
      "clicked": 75,
      "bounced": 10,
      "unsubscribed": 2
    }
  ]
}
```

---

### Get Top Campaigns
Get top performing campaigns.

**Endpoint:** `GET /api/analytics/top-campaigns`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Number of campaigns | 10 |
| metric | string | openRate or clickRate | openRate |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Welcome Email",
      "subject": "Welcome!",
      "stats": {
        "sent": 1000,
        "delivered": 990,
        "opened": 495,
        "clicked": 198
      },
      "createdAt": "2026-01-15T00:00:00.000Z",
      "rates": {
        "openRate": "50.00",
        "clickRate": "40.00"
      }
    }
  ]
}
```

---

### Get Engagement Metrics
Get subscriber engagement metrics.

**Endpoint:** `GET /api/analytics/engagement`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "engagementBreakdown": [
      {
        "_id": 0,
        "count": 100,
        "avgClicks": 0
      },
      {
        "_id": 1,
        "count": 200,
        "avgClicks": 1
      },
      {
        "_id": 5,
        "count": 150,
        "avgClicks": 5
      }
    ],
    "bestHours": [
      {
        "_id": 9,
        "avgOpenRate": 0.45,
        "totalSent": 5000
      },
      {
        "_id": 10,
        "avgOpenRate": 0.42,
        "totalSent": 8000
      }
    ]
  }
}
```

---

## Dashboard API

### Get Dashboard Data
Get dashboard overview data.

**Endpoint:** `GET /api/dashboard`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | string | Time period (e.g., 7d, 30d, 90d) | 30d |

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "overview": {
      "totalCampaigns": 50,
      "activeCampaigns": 2,
      "totalSubscribers": 500,
      "activeSubscribers": 450,
      "totalAudiences": 5,
      "totalTemplates": 10,
      "totalTags": 15
    },
    "emailMetrics": {
      "totalSent": 50000,
      "totalOpened": 12250,
      "totalClicked": 3675,
      "totalBounced": 1000,
      "totalUnsubscribed": 245,
      "rates": {
        "openRate": "25.00",
        "clickRate": "30.00",
        "bounceRate": "2.00",
        "unsubscribeRate": "0.50"
      }
    },
    "recentCampaigns": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Summer Sale",
        "status": "completed",
        "createdAt": "2026-02-08T11:40:03.000Z",
        "stats": {
          "sent": 1000,
          "opened": 250
        }
      }
    ],
    "recentSubscribers": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "active",
        "createdAt": "2026-02-08T10:00:00.000Z"
      }
    ],
    "topTags": [
      {
        "_id": "507f1f77bcf86cd799439051",
        "name": "newsletter",
        "subscriberCount": 500,
        "color": "#3498db"
      }
    ],
    "campaignsByStatus": {
      "draft": 10,
      "scheduled": 5,
      "sending": 2,
      "completed": 30,
      "paused": 3
    },
    "subscriberGrowth": [
      {
        "_id": "2026-02-01",
        "count": 10
      },
      {
        "_id": "2026-02-02",
        "count": 15
      }
    ]
  }
}
```

---

### Get Campaign Performance
Get campaign performance data.

**Endpoint:** `GET /api/dashboard/campaigns`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| sortBy | string | Sort field | createdAt |
| sortOrder | string | asc or desc | desc |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Summer Sale",
      "subject": "🔥 Don't Miss Our Summer Sale!",
      "status": "completed",
      "createdAt": "2026-02-08T11:40:03.000Z",
      "stats": {
        "sent": 1000,
        "delivered": 980,
        "opened": 245,
        "clicked": 98,
        "bounced": 20,
        "unsubscribed": 5
      },
      "rates": {
        "openRate": "25.00",
        "clickRate": "40.00"
      }
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

### Get Subscriber Analytics
Get subscriber analytics data.

**Endpoint:** `GET /api/dashboard/subscribers`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "total": 500,
      "active": 450,
      "unsubscribed": 30,
      "bounced": 20,
      "complained": 0,
      "activeRate": "90.00"
    },
    "growthData": [
      {
        "_id": "2026-02-01",
        "count": 10
      },
      {
        "_id": "2026-02-02",
        "count": 15
      }
    ],
    "sourceBreakdown": [
      {
        "_id": "manual",
        "count": 200
      },
      {
        "_id": "import",
        "count": 250
      },
      {
        "_id": "landing_page",
        "count": 50
      }
    ]
  }
}
```

---

## Settings API

### Get Profile
Get user profile.

**Endpoint:** `GET /api/settings/profile`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Inc",
      "timezone": "UTC",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "settings": {}
  }
}
```

---

### Update Profile
Update user profile.

**Endpoint:** `PUT /api/settings/profile`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1987654321",
  "company": "New Company",
  "timezone": "America/New_York",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "id": "507f1f77bcf86cd799439001",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "+1987654321",
    "company": "New Company",
    "timezone": "America/New_York",
    "avatar": "https://example.com/avatar.jpg"
  },
  "message": "Profile updated successfully"
}
```

---

### Get Notification Settings
Get notification preferences.

**Endpoint:** `GET /api/settings/notifications`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "emailCampaignReports": true,
    "subscriberActivity": true,
    "systemUpdates": true,
    "marketingEmails": false
  }
}
```

---

### Update Notification Settings
Update notification preferences.

**Endpoint:** `PUT /api/settings/notifications`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "emailCampaignReports": true,
  "subscriberActivity": false,
  "systemUpdates": true,
  "marketingEmails": false
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "emailCampaignReports": true,
    "subscriberActivity": false,
    "systemUpdates": true,
    "marketingEmails": false
  },
  "message": "Notification settings updated"
}
```

---

### Get Security Settings
Get security settings.

**Endpoint:** `GET /api/settings/security`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "twoFactorEnabled": false,
    "loginAlerts": true,
    "lastPasswordChange": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### Update Password
Update account password.

**Endpoint:** `PUT /api/settings/password`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password updated successfully"
}
```

---

### Update Security Settings
Update security preferences.

**Endpoint:** `PUT /api/settings/security`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "loginAlerts": false
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Security settings updated"
}
```

---

### Get All Settings
Get all settings at once.

**Endpoint:** `GET /api/settings`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "profile": {
      "id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Inc",
      "timezone": "UTC",
      "avatar": null
    },
    "notifications": {
      "emailCampaignReports": true,
      "subscriberActivity": true,
      "systemUpdates": true,
      "marketingEmails": false
    },
    "security": {
      "twoFactorEnabled": false,
      "loginAlerts": true,
      "lastPasswordChange": "2026-01-01T00:00:00.000Z"
    },
    "preferences": {}
  }
}
```

---

### Update All Settings
Update all settings at once.

**Endpoint:** `PUT /api/settings`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "profile": {
    "name": "John Updated",
    "phone": "+1987654321",
    "company": "New Company"
  },
  "notifications": {
    "emailCampaignReports": true,
    "subscriberActivity": false
  },
  "preferences": {
    "theme": "dark"
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Settings updated successfully"
}
```

---

## User Management API (Admin Only)

### Get All Users
Get paginated list of users.

**Endpoint:** `GET /api/users`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| search | string | Search in name/email | - |
| role | string | Filter by role | - |
| isActive | boolean | Filter by active status | - |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "isEmailVerified": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastLoginAt": "2026-02-08T11:40:03.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### Get User By ID
Get a specific user.

**Endpoint:** `GET /api/users/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "isEmailVerified": true,
    "phone": "+1234567890",
    "company": "Acme Inc",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "lastLoginAt": "2026-02-08T11:40:03.000Z",
    "stats": {
      "campaigns": 10,
      "subscribers": 500
    }
  }
}
```

---

### Create User
Create a new user.

**Endpoint:** `POST /api/users`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "admin",
  "phone": "+1234567890",
  "company": "Tech Corp"
}
```

**Response (201):**
```json
{
  "ok": true,
  "data": {
    "id": "507f1f77bcf86cd799439002",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin"
  },
  "message": "User created successfully"
}
```

---

### Update User
Update an existing user.

**Endpoint:** `PUT /api/users/:id`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Updated",
  "email": "jane.updated@example.com",
  "role": "admin",
  "isActive": true,
  "phone": "+1987654321",
  "company": "New Tech Corp"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "id": "507f1f77bcf86cd799439002",
    "name": "Jane Updated",
    "email": "jane.updated@example.com",
    "role": "admin",
    "isActive": true
  },
  "message": "User updated successfully"
}
```

---

### Delete User
Delete a user.

**Endpoint:** `DELETE /api/users/:id`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| deleteData | string | Set to "true" to delete all user data |

**Response (200):**
```json
{
  "ok": true,
  "message": "User deleted successfully"
}
```

---

### Reset User Password
Reset a user's password.

**Endpoint:** `POST /api/users/:id/reset-password`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

---

### Get User Stats
Get user statistics.

**Endpoint:** `GET /api/users/stats`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "total": 100,
      "active": 90,
      "admins": 5,
      "verified": 80
    },
    "roleDistribution": {
      "user": 95,
      "admin": 4,
      "superadmin": 1
    },
    "recentRegistrations": [
      {
        "_id": "507f1f77bcf86cd799439099",
        "name": "New User",
        "email": "new@example.com",
        "role": "user",
        "createdAt": "2026-02-08T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Audit Logs API

### Get Audit Logs (Admin)
Get paginated audit logs.

**Endpoint:** `GET /api/audit-logs`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 50 |
| userId | string | Filter by user ID | - |
| action | string | Filter by action | - |
| entityType | string | Filter by entity type | - |
| startDate | string | Start date (ISO 8601) | - |
| endDate | string | End date (ISO 8601) | - |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439061",
      "userId": {
        "_id": "507f1f77bcf86cd799439001",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "CAMPAIGN_CREATED",
      "entityType": "Campaign",
      "entityId": "507f1f77bcf86cd799439011",
      "newValues": {
        "name": "Summer Sale",
        "subject": "🔥 Don't Miss Our Summer Sale!"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-02-08T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

---

### Get My Audit Logs
Get audit logs for the current user.

**Endpoint:** `GET /api/audit-logs/my`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 50 |
| action | string | Filter by action | - |
| entityType | string | Filter by entity type | - |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439061",
      "action": "CAMPAIGN_CREATED",
      "entityType": "Campaign",
      "entityId": "507f1f77bcf86cd799439011",
      "newValues": {
        "name": "Summer Sale"
      },
      "createdAt": "2026-02-08T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

### Get Audit Log By ID
Get a specific audit log entry.

**Endpoint:** `GET /api/audit-logs/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439061",
    "userId": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "action": "CAMPAIGN_CREATED",
    "entityType": "Campaign",
    "entityId": "507f1f77bcf86cd799439011",
    "oldValues": null,
    "newValues": {
      "name": "Summer Sale",
      "subject": "🔥 Don't Miss Our Summer Sale!",
      "type": "promotional"
    },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2026-02-08T12:00:00.000Z"
  }
}
```

---

### Get Audit Logs By Entity (Admin)
Get audit logs for a specific entity.

**Endpoint:** `GET /api/audit-logs/entity/:entityType/:entityId`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439061",
      "userId": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "CAMPAIGN_CREATED",
      "entityType": "Campaign",
      "entityId": "507f1f77bcf86cd799439011",
      "newValues": {
        "name": "Summer Sale"
      },
      "createdAt": "2026-02-08T12:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439062",
      "userId": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "CAMPAIGN_UPDATED",
      "entityType": "Campaign",
      "entityId": "507f1f77bcf86cd799439011",
      "oldValues": {
        "name": "Old Name"
      },
      "newValues": {
        "name": "Summer Sale"
      },
      "createdAt": "2026-02-08T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### Get Audit Log Stats (Admin)
Get audit log statistics.

**Endpoint:** `GET /api/audit-logs/stats`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "actionBreakdown": [
      {
        "_id": "CAMPAIGN_CREATED",
        "count": 50
      },
      {
        "_id": "CAMPAIGN_SENT",
        "count": 30
      }
    ],
    "entityBreakdown": [
      {
        "_id": "Campaign",
        "count": 100
      },
      {
        "_id": "Subscriber",
        "count": 50
      }
    ],
    "dailyActivity": [
      {
        "_id": "2026-02-01",
        "count": 20
      },
      {
        "_id": "2026-02-02",
        "count": 25
      }
    ]
  }
}
```

---

### Export Audit Logs (Admin)
Export audit logs as CSV or JSON.

**Endpoint:** `GET /api/audit-logs/export`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | json or csv |
| startDate | string | Start date (ISO 8601) |
| endDate | string | End date (ISO 8601) |

**Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "createdAt": "2026-02-08T12:00:00.000Z",
      "user": "John Doe",
      "action": "CAMPAIGN_CREATED",
      "entityType": "Campaign",
      "ipAddress": "192.168.1.1"
    }
  ],
  "count": 100
}
```

---

## Scrape API

### Start Scrape
Start an Apify actor scrape.

**Endpoint:** `POST /api/scrape/scrape`

**Request Body:**
```json
{
  "actorId": "apify/actor-id",
  "input": {
    "startUrls": [
      {
        "url": "https://example.com/directory"
      }
    ],
    "maxItems": 100
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "actorRun": {
    "id": "run-id",
    "status": "succeeded",
    "startedAt": "2026-02-08T12:00:00.000Z",
    "finishedAt": "2026-02-08T12:05:00.000Z"
  },
  "itemsCount": 50,
  "savedCount": 45
}
```

---

### List Leads
List scraped leads.

**Endpoint:** `GET /api/scrape/leads`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page (max 100) | 50 |
| q | string | Search query | - |

**Response (200):**
```json
{
  "ok": true,
  "total": 100,
  "page": 1,
  "limit": 50,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439071",
      "name": "Company Name",
      "website": "https://company.com",
      "emails": ["contact@company.com"],
      "phones": ["+1234567890"],
      "address": "123 Main St, City, Country",
      "sourceActor": "apify/actor-id",
      "validatedEmails": ["contact@company.com"],
      "raw": {
        "url": "https://company.com",
        "title": "Company Name"
      },
      "createdAt": "2026-02-08T12:00:00.000Z"
    }
  ]
}
```

---

### Get Lead
Get a single lead.

**Endpoint:** `GET /api/scrape/leads/:id`

**Response (200):**
```json
{
  "ok": true,
  "lead": {
    "_id": "507f1f77bcf86cd799439071",
    "name": "Company Name",
    "website": "https://company.com",
    "emails": ["contact@company.com"],
    "phones": ["+1234567890"],
    "address": "123 Main St, City, Country",
    "sourceActor": "apify/actor-id",
    "validatedEmails": ["contact@company.com"],
    "raw": {
      "url": "https://company.com",
      "title": "Company Name"
    },
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  }
}
```

---

## Enums & Constants

### Campaign Status
| Status | Description |
|--------|-------------|
| `draft` | Campaign is being edited |
| `scheduled` | Campaign is scheduled for sending |
| `sending` | Campaign is currently being sent |
| `paused` | Campaign sending is paused |
| `completed` | Campaign sending is complete |
| `cancelled` | Campaign was cancelled |
| `failed` | Campaign failed to send |

### Campaign Type
| Type | Description |
|------|-------------|
| `newsletter` | Regular newsletter |
| `promotional` | Promotional/sales email |
| `transactional` | Transactional email |
| `welcome` | Welcome email |
| `abandoned_cart` | Abandoned cart reminder |
| `reengagement` | Re-engagement campaign |
| `onboarding` | Onboarding email series |
| `event_invitation` | Event invitation |
| `survey` | Survey request |

### Email Provider
| Provider | Description |
|----------|-------------|
| `sendgrid` | SendGrid |
| `mailgun` | Mailgun |
| `ses` | Amazon SES |
| `smtp` | Custom SMTP |
| `postmark` | Postmark |
| `resend` | Resend |

### Subscriber Status
| Status | Description |
|--------|-------------|
| `active` | Active subscriber |
| `unsubscribed` | Unsubscribed |
| `bounced` | Email bounced |
| `complained` | Marked as spam |

### User Roles
| Role | Description |
|------|-------------|
| `user` | Regular user |
| `admin` | Administrator |
| `superadmin` | Super administrator |

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

API requests are rate limited. If you exceed the limit, you will receive a `429 Too Many Requests` response.

---

## Version

API Version: **v1**

Last Updated: **2026-02-08**
