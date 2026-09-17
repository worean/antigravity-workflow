# 🏃 Sprints API (`/api/sprints`)

애자일 스크럼 스프린트 생성, 기간 설정, 번다운 및 스프린트 주기를 관리합니다.

---

## 📌 서브 라우트 목차
- **[스프린트 이슈 할당](./issues.md)**: `POST /api/sprints/:id/issues`
- **[스프린트 토론 조회](./discussions.md)**: `GET /api/sprints/:id/discussions`
- **[스프린트 작업로그 집계](./worklogs.md)**: `GET /api/sprints/:id/worklogs`

---

## 기본 CRUD 엔드포인트

### 1. 스프린트 목록 조회
- **Endpoint**: `GET /api/sprints`
- **Auth**: 불필요 (또는 `Bearer <token>`)
- **Query Parameters**:
  - `projectId` (number): 프로젝트 ID
  - `status` (`PLANNING` | `ACTIVE` | `COMPLETED`): 상태 필터
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Sprint 1 (초기 인프라 구축)",
    "goal": "백엔드 및 프론트 기본 구조 완성",
    "projectId": 1,
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-09-15T00:00:00.000Z",
    "status": "ACTIVE",
    "_count": { "issues": 8 }
  }
]
```

---

### 2. 스프린트 단건 조회
- **Endpoint**: `GET /api/sprints/:id`
- **Auth**: 불필요 (또는 `Bearer <token>`)
- **Response (200 OK)**: 스프린트 상세 및 할당된 이슈 목록

---

### 3. 신규 스프린트 생성
- **Endpoint**: `POST /api/sprints`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "name": "Sprint 2",
  "goal": "태그 시스템 및 UI 연동",
  "projectId": 1,
  "startDate": "2026-09-16",
  "endDate": "2026-09-30"
}
```
- **Response (201 Created)**: 생성된 스프린트 객체

---

### 4. 스프린트 정보 수정
- **Endpoint**: `PUT /api/sprints/:id`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**: `Partial<Sprint>`
- **Response (200 OK)**: 갱신된 스프린트 객체

---

### 5. 스프린트 삭제
- **Endpoint**: `DELETE /api/sprints/:id`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**: `{ "message": "Sprint deleted successfully" }`
