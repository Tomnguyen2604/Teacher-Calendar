# REST API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register a New User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "teacher@school.edu",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "teacher@school.edu",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "teacher@school.edu",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "teacher@school.edu",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### Get Current User
**GET** `/api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "teacher@school.edu",
  "name": "John Doe",
  "role": "user"
}
```

---

## User Endpoints

### Get All Users
**GET** `/api/users`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "email": "teacher@school.edu",
    "name": "John Doe",
    "role": "user",
    "created_at": "2026-01-20T18:00:00.000Z"
  }
]
```

---

### Get User by ID
**GET** `/api/users/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "teacher@school.edu",
  "name": "John Doe",
  "role": "user",
  "created_at": "2026-01-20T18:00:00.000Z"
}
```

---

## Event (Ticket) Endpoints

### Get All Events
**GET** `/api/tickets`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assigneeId` (optional): Filter by assignee ID
- `creatorId` (optional): Filter by creator ID
- `search` (optional): Search in title and description

**Example:**
```
GET /api/tickets?status=OPEN&priority=HIGH
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Parent-Teacher Conference",
    "description": "Annual conference with parents",
    "status": "OPEN",
    "priority": "HIGH",
    "creator_id": 1,
    "assignee_id": 2,
    "created_at": "2026-01-20T18:00:00.000Z",
    "updated_at": "2026-01-20T18:00:00.000Z",
    "creator": {
      "id": 1,
      "name": "John Doe",
      "email": "teacher@school.edu"
    },
    "assignee": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@school.edu"
    },
    "comments": []
  }
]
```

---

### Get Event by ID
**GET** `/api/tickets/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Parent-Teacher Conference",
  "description": "Annual conference with parents",
  "status": "OPEN",
  "priority": "HIGH",
  "creator_id": 1,
  "assignee_id": 2,
  "created_at": "2026-01-20T18:00:00.000Z",
  "updated_at": "2026-01-20T18:00:00.000Z",
  "creator": {
    "id": 1,
    "name": "John Doe",
    "email": "teacher@school.edu"
  },
  "assignee": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@school.edu"
  },
  "comments": [
    {
      "id": 1,
      "content": "Looking forward to this!",
      "created_at": "2026-01-20T18:30:00.000Z",
      "user": {
        "id": 2,
        "name": "Jane Smith"
      }
    }
  ]
}
```

---

### Create Event
**POST** `/api/tickets`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Field Trip to Museum",
  "description": "Annual field trip for 5th grade students",
  "status": "OPEN",
  "priority": "MEDIUM",
  "assigneeId": 2
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "title": "Field Trip to Museum",
  "description": "Annual field trip for 5th grade students",
  "status": "OPEN",
  "priority": "MEDIUM",
  "creator_id": 1,
  "assignee_id": 2,
  "created_at": "2026-01-20T19:00:00.000Z",
  "updated_at": "2026-01-20T19:00:00.000Z",
  "creator": {
    "id": 1,
    "name": "John Doe",
    "email": "teacher@school.edu"
  },
  "assignee": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@school.edu"
  }
}
```

---

### Update Event
**PUT** `/api/tickets/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Parent-Teacher Conference",
  "description": "Annual conference with parents",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "creator_id": 1,
  "assignee_id": 2,
  "created_at": "2026-01-20T18:00:00.000Z",
  "updated_at": "2026-01-20T19:15:00.000Z",
  "creator": {...},
  "assignee": {...}
}
```

---

### Delete Event
**DELETE** `/api/tickets/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

---

## Comment Endpoints

### Get Comments for an Event
**GET** `/api/tickets/:ticketId/comments`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "ticket_id": 1,
    "user_id": 2,
    "content": "Looking forward to this!",
    "created_at": "2026-01-20T18:30:00.000Z",
    "user": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@school.edu"
    }
  }
]
```

---

### Add Comment to Event
**POST** `/api/tickets/:ticketId/comments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "This is a great idea!"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "ticket_id": 1,
  "user_id": 1,
  "content": "This is a great idea!",
  "created_at": "2026-01-20T19:30:00.000Z",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "teacher@school.edu"
  }
}
```

---

### Delete Comment
**DELETE** `/api/comments/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Health Check

### Check API Health
**GET** `/api/health`

**No authentication required**

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T19:45:00.000Z",
  "service": "School Calendar Exchange API"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Email, password, and name are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to delete this ticket"
}
```

### 404 Not Found
```json
{
  "error": "Ticket not found"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Testing with cURL

### Register and Login
```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.edu","password":"pass123","name":"John Doe"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.edu","password":"pass123"}'
```

### Create and Get Events
```bash
# Create event (replace TOKEN with your JWT)
curl -X POST http://localhost:4000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Field Trip","description":"Museum visit","priority":"HIGH"}'

# Get all events
curl http://localhost:4000/api/tickets \
  -H "Authorization: Bearer TOKEN"

# Get specific event
curl http://localhost:4000/api/tickets/1 \
  -H "Authorization: Bearer TOKEN"
```

### Add Comments
```bash
# Add comment to event
curl -X POST http://localhost:4000/api/tickets/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"content":"Great event!"}'
```
