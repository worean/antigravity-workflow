# 📅 POST /api/calendar/sync/google & GET /api/calendar/google/status

Google Calendar 연동 자격 상태 조회 및 워크스페이스 일정 동기화를 수행합니다.

> [!IMPORTANT]
> Google Calendar 연동 및 동기화 API는 **Google 계정으로 로그인한 사용자**(`SocialAccount`에 Google provider 보유)에게만 지원됩니다.
> 일반 계정 로그인 사용자가 호출할 경우 **`403 Forbidden`** 에러가 반환됩니다.

---

## 1. GET /api/calendar/google/status

현재 로그인한 유저의 Google Calendar 연동 자격 상태를 조회합니다.

### 요청 예시
```http
GET /api/calendar/google/status HTTP/1.1
Host: localhost:4000
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 성공 응답 (Google 로그인 사용자)
```json
{
  "isGoogleLinked": true,
  "googleEmail": "user@gmail.com",
  "lastSyncedAt": "2026-09-17T09:30:00.000Z",
  "message": "Google 캘린더 연동이 활성화되어 있습니다."
}
```

### 성공 응답 (일반 로그인 사용자)
```json
{
  "isGoogleLinked": false,
  "googleEmail": null,
  "lastSyncedAt": null,
  "message": "Google 계정으로 로그인한 유저만 Google 캘린더 연동을 이용할 수 있습니다."
}
```

---

## 2. POST /api/calendar/sync/google

현재 워크스페이스의 주요 이슈 일정을 사용자의 Google Calendar에 동기화합니다.

### 요청 예시
```http
POST /api/calendar/sync/google HTTP/1.1
Host: localhost:4000
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json

{}
```

### 성공 응답 (200 OK - Google 로그인 사용자)
```json
{
  "success": true,
  "message": "Google 캘린더와 성공적으로 동기화되었습니다. (총 12건의 일정)",
  "syncedCount": 12,
  "lastSyncedAt": "2026-09-17T09:40:00.000Z",
  "googleEmail": "user@gmail.com"
}
```

### 실패 응답 (403 Forbidden - 일반 로그인 사용자)
```json
{
  "error": "Google 계정으로 로그인한 사용자만 Google 캘린더 동기화를 이용할 수 있습니다."
}
```

- **401 Unauthorized**: 인증 토큰 누락 또는 만료
```json
{
  "error": "Unauthorized: Authentication token is required"
}
```
