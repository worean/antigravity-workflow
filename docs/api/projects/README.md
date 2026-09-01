// -*- coding: utf-8 -*-
# 📁 Projects API (`/api/projects`)

통합 프로젝트 관리 시스템의 기본 CRUD 및 다중 필터링 조회를 담당합니다.

---

## 📌 서브 라우트 목차
- **[프로젝트 멤버 관리](./members.md)**: `POST/PUT/DELETE /api/projects/:id/members`
- **[프로젝트 부서/그룹 연동](./groups.md)**: `POST/PUT/DELETE /api/projects/:id/groups`

---

## 기본 CRUD 엔드포인트

### 1. 프로젝트 목록 조회
- **Endpoint**: `GET /api/projects`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `search` (string): 프로젝트 이름, 키, 설명 또는 `#태그` 검색
  - `tag` (string): 특정 태그명 필터링 (예: `기능개발`)
  - `tagId` (number): 특정 태그 ID 필터링
  - `statusId` (number): 프로젝트 상태 ID
  - `priorityId` (number): 프로젝트 우선순위 ID
  - `ownerId` (number | `'my'`): 소유자 필터링
  - `memberId` (number | `'my'`): 참여 멤버 필터링
  - `sortBy` (`id` | `name` | `key` | `dueDate` | `createdAt` 등): 정렬 필드
  - `order` (`asc` | `desc`): 정렬 방향
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "AntiGravity Core Systems",
    "key": "AGY",
    "description": "핵심 워크플로우 백엔드 시스템",
    "ownerId": 1,
    "statusId": 1,
    "priorityId": 1,
    "tags": [
      { "id": 1, "name": "Core", "color": "#3b82f6" }
    ],
    "owner": { "id": 1, "name": "홍길동", "email": "user@example.com" },
    "_count": { "issues": 15, "sprints": 2 }
  }
]
```

---

### 2. 프로젝트 단건 상세 조회
- **Endpoint**: `GET /api/projects/:id`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**: 프로젝트 상세 객체 (멤버, 그룹, 스프린트, 마일스톤, 커스텀 필드 정의 포함)

---

### 3. 신규 프로젝트 생성
- **Endpoint**: `POST /api/projects`
- **Auth**: `Bearer <token>` (필수, 생성자가 자동으로 PM/Owner로 등록됨)
- **Request Body**:
```json
{
  "name": "신규 프로젝트",
  "key": "NEWPRJ",
  "description": "프로젝트 설명",
  "tags": ["#기능개발", "신규"]
}
```
- **Response (201 Created)**: 생성된 프로젝트 객체

---

### 4. 프로젝트 정보 수정
- **Endpoint**: `PUT /api/projects/:id`
- **Auth**: `Bearer <token>` (PM/Owner 권한 필요)
- **Request Body**:
```json
{
  "name": "수정된 프로젝트 이름",
  "description": "수정된 설명",
  "statusId": 2,
  "priorityId": 2,
  "dueDate": "2026-12-31"
}
```
- **Response (200 OK)**: 갱신된 프로젝트 객체

---

### 5. 프로젝트 삭제
- **Endpoint**: `DELETE /api/projects/:id`
- **Auth**: `Bearer <token>` (PM/Owner 권한 필요)
- **Response (200 OK)**: `{ "message": "Project deleted successfully" }`
