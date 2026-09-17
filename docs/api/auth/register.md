# ✉️ POST /api/auth/register (회원가입 요청)

일반 이메일 및 비밀번호 기반의 회원가입을 요청하고, 24시간 동안 유효한 6자리 인증코드(OTP)와 인증 URL을 사용자 이메일로 발송합니다.

---

## 1. Request Specification
- **HTTP Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Auth Required**: `None`
- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "홍길동"
  }
  ```

| 필드명 | 타입 | 필수 여부 | 설명 및 제약조건 |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **필수** | 고유 사용자 이메일 주소 |
| `password` | `string` | **필수** | **최소 6자 이상** 계정 비밀번호 |
| `name` | `string` | 선택 | 사용자 이름 (미지정 시 이메일 아이디 사용) |

---

## 2. Response Specification
- **Status Code**: `201 Created`
- **Response Body (JSON)**:
  ```json
  {
    "message": "회원가입 요청이 접수되었습니다. 이메일로 발송된 6자리 인증코드를 입력해주세요.",
    "requireVerification": true,
    "email": "user@example.com"
  }
  ```

---

## 3. Error Responses
- **400 Bad Request**:
  - 비밀번호 길이 미달: `"비밀번호는 최소 6자 이상이어야 합니다."`
  - 이미 가입된 이메일: `"이미 가입된 이메일 주소입니다."`
  - 소셜 가입 이메일: `"해당 이메일은 Google(소셜) 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요."`
