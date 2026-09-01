# 🏢 Workspaces API (`/api/workspaces`)

멀티테넌트 워크스페이스 생성, 테넌트 격리 및 워크스페이스 전환을 관리합니다.

---

## 📌 서브 라우트 목차
- **[워크스페이스 멤버 관리](./members.md)**: `DELETE /api/workspaces/:id/members/:userId`
- **[초대 링크 및 가입](./invitations.md)**: `POST /api/workspaces/:id/invitations`, `POST /api/workspaces/join`

---

## 기본 CRUD 엔드포인트

### 1. 내 워크스페이스 목록 조회
- **Endpoint**: `GET /api/workspaces`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "My Team Workspace",
    "slug": "my-team",
    "ownerId": 1,
    "role": "OWNER",
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```

---

### 2. 신규 워크스페이스 생성
- **Endpoint**: `POST /api/workspaces`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "name": "새 워크스페이스",
  "slug": "new-workspace"
}
```
- **Response (201 Created)**: 생성된 워크스페이스 객체

---

### 3. 특정 워크스페이스 상세 조회
- **Endpoint**: `GET /api/workspaces/:id`
- **Auth**: `Bearer <token>` (워크스페이스 접근 권한 필요)
- **Response (200 OK)**: 워크스페이스 상세 (멤버, 프로젝트, 초대 토큰 포함)
