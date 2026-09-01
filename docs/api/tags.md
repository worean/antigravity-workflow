// -*- coding: utf-8 -*-
# 🏷️ Tags API (`/api/tags`)

해시태그(`#태그`) 목록 조회, 사용 통계(이슈/프로젝트 연결 수), 생성 및 삭제를 담당합니다.

---

## 엔드포인트 목록

### 1. 태그 목록 및 사용 통계 조회
- **Endpoint**: `GET /api/tags`
- **Auth**: 불필요 (누구나 조회 가능)
- **Query Parameters**:
  - `search` (string): 태그명 검색 (예: `#버그` 또는 `버그`)
  - `limit` (number): 반환할 최대 태그 수 (기본: 50)
  - `sortBy` (`count` | `name` | `recent`): 정렬 기준 (기본: `count`)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "버그수정",
    "color": "#ef4444",
    "issuesCount": 12,
    "projectsCount": 2,
    "totalCount": 14,
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```

---

### 2. 신규 태그 생성
- **Endpoint**: `POST /api/tags`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "name": "긴급_배포",
  "color": "#ef4444"
}
```
- **Response (201 Created)**: 생성/조회된 태그 객체

---

### 3. 태그 삭제
- **Endpoint**: `DELETE /api/tags/:id`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**:
```json
{
  "message": "Tag deleted successfully"
}
```
