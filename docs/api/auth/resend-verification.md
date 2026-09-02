# 🔄 POST /api/auth/resend-verification (인증코드 재발송)

이메일을 수신하지 못했거나 인증코드가 만료된 경우 새 6자리 OTP 코드를 재발급하여 발송합니다.

---

## 1. Request Specification
- **HTTP Method**: `POST`
- **Endpoint**: `/api/auth/resend-verification`
- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

---

## 2. Response Specification
- **Status Code**: `200 OK`
- **Response Body (JSON)**:
  ```json
  {
    "message": "새로운 6자리 인증코드가 발송되었습니다. 메일을 확인해주세요.",
    "email": "user@example.com"
  }
  ```
