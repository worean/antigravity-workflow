# 🔑 POST /api/auth/verify-email (6자리 OTP 이메일 인증)

이메일로 수신한 6자리 OTP 인증코드를 제출하여 이메일 소유권을 검증하고 회원가입을 최종 완료합니다. 완료 시 기본 Workspace가 자동 생성됩니다.

---

## 1. Request Specification
- **HTTP Method**: `POST`
- **Endpoint**: `/api/auth/verify-email`
- **Auth Required**: `None`
- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "code": "749201"
  }
  ```

---

## 2. Response Specification
- **Status Code**: `200 OK`
- **Response Body (JSON)**:
  ```json
  {
    "message": "이메일 인증이 완료되어 회원가입이 완료되었습니다.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 12,
      "email": "user@example.com",
      "name": "홍길동",
      "role": "MEMBER",
      "isEmailVerified": true
    },
    "workspace": {
      "id": 5,
      "slug": "hong-s-workspace-12",
      "name": "홍길동's Workspace",
      "dbType": "sqlite"
    }
  }
  ```
