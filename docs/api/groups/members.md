// -*- coding: utf-8 -*-
# 👥 Group Members API (`/api/groups/:id/members`)

부서 및 그룹에 사용자를 소속시키고 직책/역할을 부여하는 서브 라우트입니다.

- **상위 라우트**: [`Groups API`](./README.md)
- **권한 요건**: `Bearer <token>` (관리자 권한)

---

## 엔드포인트 목록

### 1. 그룹 멤버 추가
- **Endpoint**: `POST /api/groups/:id/members`
- **Auth**: `Bearer <token>` (관리자)
- **Request Body**:
```json
{
  "userId": 5,
  "role": "MEMBER", // "LEADER" | "MEMBER"
  "title": "선임 연구원"
}
```
- **Response (200 OK)**:
```json
{
  "id": 1,
  "groupId": 2,
  "userId": 5,
  "role": "MEMBER",
  "title": "선임 연구원"
}
```

---

### 2. 그룹 멤버 직책 및 역할 수정
- **Endpoint**: `PUT /api/groups/:id/members/:userId`
- **Auth**: `Bearer <token>` (관리자)
- **Request Body**:
```json
{
  "role": "LEADER",
  "title": "팀장"
}
```
- **Response (200 OK)**: 갱신된 멤버 정보

---

### 3. 그룹에서 멤버 제거
- **Endpoint**: `DELETE /api/groups/:id/members/:userId`
- **Auth**: `Bearer <token>` (관리자)
- **Response (200 OK)**: `{ "message": "Member removed from group" }`
