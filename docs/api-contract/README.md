# API Contract Documentation

Extracted from **API Contract v4.0** (Flipkart Academy SCOA, April 23, 2026).

| Module | Topic | File |
|--------|-------|------|
| 1 | Admin Auth | *(not yet extracted)* |
| 2 | Student Auth | *(not yet extracted)* |
| **3** | **Admin Courses** | [module-3-admin-courses.md](./module-3-admin-courses.md) |
| 4 | Notification Logs | *(not yet extracted)* |
| 5 | Webhooks | *(not yet extracted)* |
| 6 | Student Courses | *(not yet extracted)* |

**Base URL:** `http://<host>:5000/api`  
**Content-Type:** `application/json` (unless stated otherwise, e.g. multipart for uploads)

## Standard response envelope

### Success

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

### Success with pagination

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": {
    "code": "ERROR_CODE",
    "details": [{ "field": "field_name", "message": "what went wrong" }]
  }
}
```

## Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource |
| `COOLDOWN_ACTIVE` | 429 | Retake blocked — cooldown in effect |
| `APP_ERROR` | varies | Business rule violation |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
