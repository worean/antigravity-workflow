# 👤 Users & Profile API (`/api/users`)

사용자 계정 정보 조회, 프로필(자기 설명, 부서, 직책 등) 수정 및 회원 관리를 담당합니다.

---

## 📌 주요 엔드포인트 목차
- **[사용자 프로필 수정 (Update Profile)](./update_profile.md)**: `PUT /api/users/:id`

---

## 기본 엔드포인트

### 1. 사용자 목록 조회
- **Endpoint**: `GET /api/users`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "email": "worean@naver.com",
    "name": "시스템 최고 관리자",
    "role": "ADMIN",
    "avatar": null,
    "avatarColor": "#38bdf8",
    "preferences": "{}",
    "bio": "AntiGravity 워크플로우 시스템 전반을 총괄합니다.",
    "department": "플랫폼개발팀",
    "jobTitle": "수석 엔지니어",
    "createdAt": "2026-09-01T00:00:00.000Z",
    "updatedAt": "2026-09-30T17:00:00.000Z"
  }
]
```

---

### 2. 단일 사용자 상세 조회
- **Endpoint**: `GET /api/users/:id`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**:
```json
{
  "id": 1,
  "email": "worean@naver.com",
  "name": "시스템 최고 관리자",
  "role": "ADMIN",
  "avatar": null,
  "avatarColor": "#38bdf8",
  "preferences": "{}",
  "bio": "AntiGravity 워크플로우 시스템 전반을 총괄합니다.",
  "department": "플랫폼개발팀",
  "jobTitle": "수석 엔지니어",
  "createdAt": "2026-09-01T00:00:00.000Z",
  "updatedAt": "2026-09-30T17:00:00.000Z",
  "groupMemberships": []
}
```
