// -*- coding: utf-8 -*-
# ⏱️ Worklogs API (`/api/worklogs`)

이슈별 작업 시간(분 단위 정수 및 시간 단위 소수점) 기록 및 조회를 담당합니다.

---

## 엔드포인트 목록

### 1. 작업로그 목록 조회
- **Endpoint**: `GET /api/worklogs` 또는 `GET /api/worklogs/issue/:issueId`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `issueId` (number): 대상 이슈 ID
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "issueId": 101,
    "userId": 1,
    "timeSpentMinutes": 90,
    "description": "API 라우팅 구현 및 단위 테스트 작성",
    "createdAt": "2026-09-01T00:00:00.000Z",
    "user": {
      "id": 1,
      "name": "홍길동",
      "email": "user@example.com"
    }
  }
]
```

---

### 2. 작업 시간 기록
- **Endpoint**: `POST /api/worklogs`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "issueId": 101,
  "timeSpent": 90,
  "description": "버그 수정 완료"
}
```
- **Response (201 Created)**: 생성된 작업로그 객체
