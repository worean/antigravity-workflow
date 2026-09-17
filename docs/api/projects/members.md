# 👥 Project Members API (`/api/projects/:id/members`)

프로젝트에 참여하는 멤버를 추가하고, 역할을 변경하거나 제외하는 서브 라우트입니다.

- **상위 라우트**: [`Projects API`](./README.md)
- **권한 요건**: 프로젝트 Manager(PM / Owner)

---

## 엔드포인트 목록

### 1. 프로젝트 멤버 추가
- **Endpoint**: `POST /api/projects/:id/members`
- **Auth**: `Bearer <token>` (PM 권한)
- **Request Body**:
```json
{
  "userId": 5,
  "role": "MEMBER" // "ADMIN" | "MEMBER" | "VIEWER"
}
```
- **Response (200 OK)**:
```json
{
  "id": 10,
  "projectId": 1,
  "userId": 5,
  "role": "MEMBER",
  "user": {
    "id": 5,
    "name": "김철수",
    "email": "chulsoo@example.com"
  }
}
```

---

### 2. 프로젝트 멤버 역할 수정
- **Endpoint**: `PUT /api/projects/:id/members/:userId`
- **Auth**: `Bearer <token>` (PM 권한)
- **Request Body**:
```json
{
  "role": "ADMIN"
}
```
- **Response (200 OK)**: 갱신된 멤버십 객체

---

### 3. 프로젝트 멤버 제거
- **Endpoint**: `DELETE /api/projects/:id/members/:userId`
- **Auth**: `Bearer <token>` (PM 권한)
- **Response (200 OK)**:
```json
{
  "message": "Member removed successfully"
}
```
