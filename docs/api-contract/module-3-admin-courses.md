# Module 3 — Admin Courses

**Source:** API Contract v4.0 (April 23, 2026) — Flipkart Academy SCOA  
**Base path:** `/api/admin/courses`  
**Auth:** All endpoints require `Authorization: Bearer <admin_token>`

Uses the [standard response envelope](./README.md#standard-response-envelope) (`success`, `message`, `data`, optional `meta`).

---

## 3.1 List Courses

`GET /api/admin/courses`

Returns a paginated, filterable list of courses. Soft-deleted courses are excluded.

### Query parameters

| Param | Type | Required | Default | Rules / values |
|-------|------|----------|---------|----------------|
| `page` | number | No | `1` | Positive integer |
| `limit` | number | No | `10` | 1–100 |
| `status` | string | No | — | `DRAFT`, `PUBLISHED`, `DISABLED` |
| `is_ncvet` | boolean | No | — | `true` or `false` |
| `search` | string | No | — | Case-insensitive search on title |

### Success — 200 OK

```json
{
  "success": true,
  "message": "Courses fetched successfully.",
  "data": [
    {
      "id": "uuid",
      "title": "Full Stack Development",
      "thumbnailUrl": "/courses/thumbnails/uuid.webp",
      "status": "PUBLISHED",
      "isNcvet": false,
      "createdAt": "2026-04-09T10:00:00.000Z",
      "updatedAt": "2026-04-21T08:30:00.000Z",
      "creator": { "id": "uuid", "name": "Super Admin" }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Errors

- **422** — Invalid query params (`VALIDATION_ERROR`)

---

## 3.2 Create Course

`POST /api/admin/courses`

Creates a new course. Optionally accepts a thumbnail image.

**Content-Type:** `multipart/form-data`

### Request fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | Yes | Non-empty |
| `description` | string | No | Optional, nullable |
| `is_ncvet` | boolean/string | No | `true`/`false` or `"true"`/`"false"`. Default: `false` |
| `thumbnail` | file | No | Image file (processed by sharp) |

### Success — 201 Created

```json
{
  "success": true,
  "message": "Course created successfully.",
  "data": {
    "id": "uuid",
    "title": "Full Stack Development",
    "description": "A comprehensive full stack course.",
    "status": "DRAFT",
    "is_ncvet": false,
    "thumbnailUrl": "/courses/thumbnails/uuid.webp",
    "createdAt": "2026-04-09T10:00:00.000Z"
  }
}
```

### Errors

- **422** — Validation failure (e.g. missing title)

---

## 3.3 Update Course Status

`PATCH /api/admin/courses/:courseId/status`

Updates publication status. Publishing (`PUBLISHED`) requires all builder steps to be complete.

### URL params

| Param | Type | Required |
|-------|------|----------|
| `courseId` | UUID | Yes |

### Request body

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | Yes | `DRAFT`, `PUBLISHED`, `DISABLED` |

| Value | Meaning |
|-------|---------|
| `DRAFT` | In progress, not visible to students |
| `PUBLISHED` | Live. Requires enrollment form, quiz, exam settings, and certificate |
| `DISABLED` | Hidden from students |

### Success — 200 OK

```json
{
  "success": true,
  "message": "Course status updated.",
  "data": { "course_id": "uuid", "status": "PUBLISHED" }
}
```

### Errors

- **400** — Publish before steps complete (`APP_ERROR`). Message lists missing steps dynamically (enrollment form, quiz, exam settings, certificate).
- **404** — Course not found

---

## 3.4 Get Full Course (Builder View)

`GET /api/admin/courses/:courseId/full`

Returns complete course builder data in one response: course details, enrollment form, quiz, exam settings, and certificate.

### URL params

| Param | Type | Required |
|-------|------|----------|
| `courseId` | UUID | Yes |

### Success — 200 OK

```json
{
  "success": true,
  "message": "Course data fetched successfully.",
  "data": {
    "course": {
      "id": "uuid",
      "title": "Full Stack Development",
      "description": "...",
      "status": "DRAFT",
      "is_ncvet": false,
      "thumbnailUrl": "/courses/thumbnails/uuid.webp"
    },
    "enrollmentForm": {},
    "quiz": {},
    "examSettings": {
      "duration_minutes": 60,
      "passing_percentage": 70,
      "max_attempts": 3,
      "cooldown_hours": 720
    },
    "certificate": {}
  }
}
```

---

## 3.5 Create / Replace Enrollment Form

`POST /api/admin/courses/:courseId/enrollment-form`

Creates a new versioned enrollment form. Each call creates a new version.

### URL params

| Param | Type | Required |
|-------|------|----------|
| `courseId` | UUID | Yes |

### Request body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | No | Optional form name, nullable |
| `groups` | array | No | Array of group objects. Default: `[]` |
| `fields` | array | Yes | At least 1 field |

#### Group object

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `tempId` | string | Yes | Unique within request |
| `label` | string | Yes | Non-empty |
| `sort_order` | number | No | Integer, default `0` |

#### Field object

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `field_key` | string | Yes | Unique within request, non-empty |
| `label` | string | Yes | Non-empty |
| `type` | string | Yes | See field types below |
| `required` | boolean | No | Default `false` |
| `sort_order` | number | No | Integer, default `0` |
| `groupTempId` | string | No | Must match a group `tempId`, or `null` |
| `config` | object | No | See config schema |

**Field types:** `text`, `textarea`, `number`, `email`, `select`, `radio`, `checkbox`, `date`, `file`

- `select` / `radio` — `config.options` required
- **Config keys:** `placeholder`, `min_length`, `max_length`, `min`, `max`, `accept`, `options`
- **Option item:** `{ "label": string, "value": string }` (both required)

### Success — 201 Created

```json
{
  "success": true,
  "message": "Enrollment form saved.",
  "data": { "formId": "uuid", "version": 1, "courseId": "uuid" }
}
```

### Errors

- **422** — Duplicate `field_key`, validation errors

---

## 3.6 Create / Replace Quiz

`POST /api/admin/courses/:courseId/quiz`

Creates a new versioned quiz for a course.

### URL params

| Param | Type | Required |
|-------|------|----------|
| `courseId` | UUID | Yes |

### Request body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | No | Optional, nullable |
| `questions` | array | Yes | At least 1 question |

#### Question object

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `question_text` | string | Yes | Non-empty |
| `sort_order` | number | No | Integer, default `0` |
| `options` | array | Yes | At least 2 options |

#### Option object

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `option_text` | string | Yes | Non-empty |
| `is_correct` | boolean | Yes | Exactly one option per question must be `true` |
| `sort_order` | number | No | Integer, default `0` |

### Success — 201 Created

```json
{
  "success": true,
  "message": "Quiz saved.",
  "data": { "quizId": "uuid", "courseId": "uuid", "version": 1, "questionCount": 1 }
}
```

### Errors

- **422** — Multiple correct options, validation errors

---

## 3.7 Save Exam Settings

`POST /api/admin/courses/:courseId/exam-settings`

Creates or updates exam settings. On first creation, `cooldown_hours` defaults to **720** (30 days) if omitted. On update, omitting `cooldown_hours` preserves the existing value.

### URL params

| Param | Type | Required |
|-------|------|----------|
| `courseId` | UUID | Yes |

### Request body

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `duration_minutes` | number | Yes | Integer, min 1 |
| `passing_percentage` | number | Yes | 0–100 |
| `max_attempts` | number | Yes | Integer, min 1 |
| `cooldown_hours` | number | No | Integer, min 0. `0` = no cooldown. Omit on update to keep existing |

### Success — 200 OK

```json
{
  "success": true,
  "message": "Exam settings saved.",
  "data": { "course_id": "uuid" }
}
```

### Errors

- **422** — Validation failure
- **404** — Course not found

---

## 3.8 Upload Certificate Template

`POST /api/admin/courses/:courseId/certificate`

Uploads the certificate template image for a course.

**Content-Type:** `multipart/form-data`

### URL params

| Param | Type | Required |
|-------|------|----------|
| `courseId` | UUID | Yes |

### Request fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `template` | file | Yes | Image file |

### Success — 200 OK

```json
{
  "success": true,
  "message": "Certificate saved.",
  "data": {
    "courseId": "uuid",
    "templateUrl": "/courses/certificates/uuid.webp"
  }
}
```

### Errors

- **404** — Course not found

---

## Publish checklist

Before setting `status: "PUBLISHED"`, all four builder steps must exist:

1. Enrollment form  
2. Quiz  
3. Exam settings  
4. Certificate  

Missing steps are listed in the **400** error message.

## Frontend mapping (this repo)

| Endpoint | Used in |
|----------|---------|
| `GET /admin/courses` | `app/admin/courses/page.tsx` |
| `GET /admin/courses/:id/full` | `components/course-builder/AdminCourseBuilder.tsx` |
| `POST /admin/courses` | Course builder — basic info |
| `POST .../enrollment-form` | Course builder — step 2 |
| `POST .../quiz` | Course builder — step 3 |
| `POST .../exam-settings` | Course builder — step 4 |
| `POST .../certificate` | Course builder — step 5 |
| `PATCH .../status` | Course builder — publish |

Paths are relative to `NEXT_PUBLIC_BACKEND_URL` via `adminAuthFetch()` in `lib/admin-api.ts`.
