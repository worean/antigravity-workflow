// -*- coding: utf-8 -*-
# 📋 Issues API (`/api/issues`)

일감(Issue) 생성, 조회, 수정, 삭제 및 태그/스케줄 관리를 담당하는 핵심 API입니다.

---

## 📌 서브 라우트 목차
- **[일괄 일정 수정 (Gantt/WBS)](./batch-schedules.md)**: `PUT /api/issues/batch-schedules`
- **[좋아요 및 반응](./reactions.md)**: `POST /api/issues/toggle-like`

---

## 기본 CRUD 엔드포인트

### 1. 이슈 목록 조회
- **Endpoint**: `GET /api/issues`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `projectId` (number): 프로젝트 ID
  - `sprintId` (number): 스프린트 ID
  - `assigneeId` (number | `'my'` | `'unassigned'`): 담당자 필터
  - `authorId` (number | `'my'`): 작성자 필터
  - `statusId` (number): 상태 ID
  - `priorityId` (number): 우선순위 ID
  - `tag` (string): 태그명 필터 (예: `긴급`)
  - `tagId` (number): 태그 ID 필터
  - `search` (string): 제목/설명/`#태그` 검색어
  - `limit` (number): 조회 개수 (전체 조회 시 `all=true`)
- **Response (200 OK)**:
```json
[
  {
    "id": 101,
    "issueNumber": 1,
    "title": "로그인 API 응답 지연 개선",
    "description": "JWT 검증 및 DB 쿼리 최적화 진행 #성능개선 #인증",
    "projectId": 1,
    "statusId": 1,
    "priorityId": 2,
    "progress": 30,
    "tags": [
      { "id": 1, "name": "성능개선", "color": "#3b82f6" },
      { "id": 2, "name": "인증", "color": "#10b981" }
    ],
    "assignee": { "id": 2, "name": "이몽룡", "email": "lee@example.com" },
    "author": { "id": 1, "name": "홍길동", "email": "hong@example.com" },
    "likesCount": 3,
    "isLiked": false,
    "commentsCount": 4
  }
]
```

---

### 2. 이슈 단건 상세 조회
- **Endpoint**: `GET /api/issues/:id`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**: 이슈 상세 객체 (하위 일감 `children`, 댓글 `comments`, 작업로그 `worklogs`, 태그 `tags` 등 포함)

---

### 3. 이슈 생성
- **Endpoint**: `POST /api/issues`
- **Auth**: `Bearer <token>` (프로젝트 참여 멤버/PM)
- **Request Body**:
```json
{
  "title": "신규 기능 개발",
  "description": "상세 설명 작성...",
  "projectId": 1,
  "priorityId": 2,
  "statusId": 1,
  "assigneeId": 2,
  "plannedStartDate": "2026-09-01",
  "dueDate": "2026-09-15",
  "tags": ["#기능", "#긴급"]
}
```
- **Response (201 Created)**: 생성된 이슈 객체

---

### 4. 이슈 수정
- **Endpoint**: `PUT /api/issues/:id`
- **Auth**: `Bearer <token>` (프로젝트 멤버/PM)
- **Request Body**: `Partial<Issue>` 및 `tags` 배열
- **Response (200 OK)**: 갱신된 이슈 객체

---

### 5. 이슈 삭제
- **Endpoint**: `DELETE /api/issues/:id`
- **Auth**: `Bearer <token>` (PM/Owner 권한 필수)
- **Response (200 OK)**: `{ "message": "Issue deleted successfully" }`
