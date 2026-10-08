# ✏️ Update User Profile API (`PUT /api/users/:id`)

사용자 프로필 정보(이름, 아바타, 자기 설명 `bio`, 소속 부서 `department`, 직책 `jobTitle`)를 수정합니다.

---

## 📌 Endpoint
- **Method**: `PUT`
- **URL**: `/api/users/:id`
- **Auth**: `Bearer <token>` (필수)

---

## 📥 Request Body

| 필드명 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :---: | :--- |
| `name` | string | 선택 | 사용자 이름 (Display Name) |
| `avatar` | string \| null | 선택 | 프로필 이미지 Base64 또는 이미지 URL |
| `avatarColor` | string \| null | 선택 | 기본 아바타 배경 색상 Hex 코드 |
| `bio` | string \| null | 선택 | 자기 설명 / 소개 문구 (최대 500자) |
| `department` | string \| null | 선택 | 소속 부서명 (예: '플랫폼개발팀', 최대 100자) |
| `jobTitle` | string \| null | 선택 | 직책 / 직급 (예: '수석 연구원', 최대 100자) |

### Request JSON Sample
```json
{
  "name": "홍길동",
  "bio": "웹 플랫폼 코어 및 분산 아키텍처 개발을 전담하고 있습니다.",
  "department": "플랫폼개발팀",
  "jobTitle": "시니어 소프트웨어 엔지니어"
}
```

---

## 📤 Response

### 200 OK (성공)
```json
{
  "id": 1,
  "email": "worean@naver.com",
  "name": "홍길동",
  "role": "ADMIN",
  "avatar": null,
  "avatarColor": "#38bdf8",
  "pushToken": null,
  "preferences": "{}",
  "bio": "웹 플랫폼 코어 및 분산 아키텍처 개발을 전담하고 있습니다.",
  "department": "플랫폼개발팀",
  "jobTitle": "시니어 소프트웨어 엔지니어",
  "createdAt": "2026-09-01T00:00:00.000Z",
  "updatedAt": "2026-09-30T17:15:00.000Z",
  "groupMemberships": []
}
```

### Negative Responses (에러)
- `400 Bad Request`: 필수 식별자 누락 또는 유효성 검사 실패
- `401 Unauthorized`: 유효하지 않거나 만료된 JWT 토큰
- `403 Forbidden`: 타 사용자 프로필 수정 권한 없음
- `404 Not Found`: 존재하지 않는 사용자 ID
