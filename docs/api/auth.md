# 🔑 Authentication API (`/api/auth`)

사용자 인증, 소셜(Google) 로그인, 이메일 로그인 및 현재 세션 정보 조회를 담당합니다.

---

## 엔드포인트 목록

### 1. 구글 소셜 로그인
- **Endpoint**: `POST /api/auth/google`
- **Auth**: 불필요
- **Request Body**:
```json
{
  "code": "google_authorization_code_string",
  "redirectUri": "http://localhost:5173"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "avatar": "https://...",
    "isGoogleLinked": true
  }
}
```

---

### 2. 이메일/비밀번호 로그인
- **Endpoint**: `POST /api/auth/login`
- **Auth**: 불필요
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userPassword123!"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "MEMBER"
  }
}
```

---

### 3. 내 세션 정보 조회
- **Endpoint**: `GET /api/auth/me`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "MEMBER",
    "avatar": null,
    "avatarColor": "#007acc",
    "preferences": "{}"
  }
}
```
