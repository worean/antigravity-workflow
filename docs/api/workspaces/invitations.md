# ✉️ Workspace Invitations API (`/api/workspaces/invitations`)

워크스페이스 초대 링크(토큰) 생성, 초대장 목록 조회 및 초대 수락을 통한 가입을 담당하는 서브 라우트입니다.

- **상위 라우트**: [`Workspaces API`](./README.md)
- **권한 요건**: `Bearer <token>` (필수)

---

## 엔드포인트 목록

### 1. 워크스페이스 초대 링크(토큰) 생성
- **Endpoint**: `POST /api/workspaces/:id/invitations`
- **Auth**: `Bearer <token>` (ADMIN 권한)
- **Request Body**:
```json
{
  "email": "invitee@example.com",
  "role": "MEMBER"
}
```
- **Response (200 OK)**:
```json
{
  "id": 1,
  "workspaceId": 1,
  "token": "inv_token_uuid_string",
  "role": "MEMBER",
  "expiresAt": "2026-09-08T00:00:00.000Z"
}
```

---

### 2. 워크스페이스 초대 목록 조회
- **Endpoint**: `GET /api/workspaces/:id/invitations`
- **Auth**: `Bearer <token>` (ADMIN 권한)
- **Response (200 OK)**: 유효한 초대장 목록

---

### 3. 초대 코드를 통한 워크스페이스 가입
- **Endpoint**: `POST /api/workspaces/join`
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "token": "inv_token_uuid_string"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Successfully joined workspace",
  "workspaceId": 1
}
```
