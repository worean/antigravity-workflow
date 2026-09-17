# 👤 Users API (`/api/users`)

사용자 정보 조회, 등록, 수정 및 환경설정/아바타 관리를 담당합니다.

---

## 엔드포인트 목록

### 1. 사용자 목록 조회
- **Endpoint**: `GET /api/users`
- **Auth**: `Bearer <token>`
- **Query Parameters**:
  - `search` (string): 이름 또는 이메일 검색어
  - `limit` (number): 조회 개수
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "MEMBER",
    "avatar": null,
    "avatarColor": "#007acc"
  }
]
```

---

### 2. 특정 사용자 조회
- **Endpoint**: `GET /api/users/:id`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**: 사용자 단건 상세 데이터

---

### 3. 신규 사용자 등록 (회원가입)
- **Endpoint**: `POST /api/users`
- **Auth**: 불필요
- **Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "name": "신규유저"
}
```
- **Response (201 Created)**: 등록된 사용자 객체

---

### 4. 사용자 정보 및 환경설정 수정
- **Endpoint**: `PUT /api/users/:id`
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "name": "수정된 이름",
  "avatar": "https://...",
  "avatarColor": "#3b82f6",
  "preferences": "{\"compactCards\": true}"
}
```
- **Response (200 OK)**: 갱신된 사용자 객체

---

### 5. 사용자 삭제
- **Endpoint**: `DELETE /api/users/:id`
- **Auth**: `Bearer <token>` (관리자 권한)
- **Response (200 OK)**: `{ "message": "User deleted successfully" }`
