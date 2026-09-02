# 🔗 GET /api/auth/verify-email-link (URL 매직 링크 인증)

이메일 본문의 "이메일 인증하기" 버튼 클릭 시 호출되는 엔드포인트로, 토큰을 검증하고 기본 Workspace 생성 후 프론트엔드로 자동 로그인 리다이렉트합니다.

---

## 1. Request Specification
- **HTTP Method**: `GET`
- **Endpoint**: `/api/auth/verify-email-link`
- **Query Parameters**:
  - `token`: 64자리 인증 토큰

---

## 2. Response & Redirect Behavior
- **인증 성공 시**: `http://localhost:5173/auth/verified?token={jwtToken}&user={encodedUserData}` 로 302 리다이렉트.
- **인증 실패 시**: `http://localhost:5173/auth/verified?error={errorMessage}` 로 302 리다이렉트.
