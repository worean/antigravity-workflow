// -*- coding: utf-8 -*-
# 📎 Attachments API (`/api/attachments`)

이슈 파일 첨부, Base64/바이너리 업로드 및 조회를 담당합니다.

---

## 엔드포인트 목록

### 1. 첨부파일 목록 조회
- **Endpoint**: `GET /api/attachments`
- **Auth**: 불필요
- **Query Parameters**:
  - `issueId` (number): 이슈 ID
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "issueId": 101,
    "fileName": "screenshot.png",
    "fileSize": 102400,
    "mimeType": "image/png",
    "url": "/uploads/screenshot.png",
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```

---

### 2. 파일 첨부 업로드
- **Endpoint**: `POST /api/attachments`
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "issueId": 101,
  "fileName": "log.txt",
  "fileSize": 2048,
  "mimeType": "text/plain",
  "data": "base64_encoded_string_or_url"
}
```
- **Response (201 Created)**: 생성된 첨부파일 객체
