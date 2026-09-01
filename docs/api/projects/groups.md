# 🏢 Project Groups API (`/api/projects/:id/groups`)

프로젝트에 부서나 그룹(팀) 단위로 권한을 부여하고 관리하는 서브 라우트입니다.

- **상위 라우트**: [`Projects API`](./README.md)
- **권한 요건**: 프로젝트 Manager(PM / Owner)

---

## 엔드포인트 목록

### 1. 프로젝트에 그룹(부서) 연결
- **Endpoint**: `POST /api/projects/:id/groups`
- **Auth**: `Bearer <token>` (PM 권한)
- **Request Body**:
```json
{
  "groupId": 2,
  "role": "MEMBER" // "ADMIN" | "MEMBER" | "VIEWER"
}
```
- **Response (200 OK)**: 연결된 프로젝트 그룹 객체

---

### 2. 프로젝트 그룹 역할 수정
- **Endpoint**: `PUT /api/projects/:id/groups/:groupId`
- **Auth**: `Bearer <token>` (PM 권한)
- **Request Body**:
```json
{
  "role": "ADMIN"
}
```
- **Response (200 OK)**: 갱신된 프로젝트 그룹 객체

---

### 3. 프로젝트에서 그룹 연결 해제
- **Endpoint**: `DELETE /api/projects/:id/groups/:groupId`
- **Auth**: `Bearer <token>` (PM 권한)
- **Response (200 OK)**: `{ "message": "Group removed from project successfully" }`
