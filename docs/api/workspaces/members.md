// -*- coding: utf-8 -*-
# 👥 Workspace Members API (`/api/workspaces/:id/members`)

워크스페이스 내 멤버 목록 및 퇴출(제거)을 담당하는 서브 라우트입니다.

- **상위 라우트**: [`Workspaces API`](./README.md)
- **권한 요건**: `Bearer <token>` (ADMIN 이상)

---

## 엔드포인트 목록

### 1. 워크스페이스 멤버 직접 초대/추가
- **Endpoint**: `POST /api/workspaces/:id/invite`
- **Auth**: `Bearer <token>` (ADMIN 권한)
- **Request Body**:
```json
{
  "email": "member@example.com",
  "role": "MEMBER" // "ADMIN" | "MEMBER" | "VIEWER"
}
```
- **Response (200 OK)**: 초대된 멤버십 객체

---

### 2. 워크스페이스에서 멤버 퇴출/제거
- **Endpoint**: `DELETE /api/workspaces/:id/members/:userId`
- **Auth**: `Bearer <token>` (ADMIN 권한)
- **Response (200 OK)**:
```json
{
  "message": "Member removed from workspace"
}
```
