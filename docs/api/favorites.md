# ⭐ Favorites API (`/api/favorites`)

프로젝트, 이슈, 스프린트, 채팅 채널 등에 대한 사용자별 즐겨찾기 등록/해제(토글) 및 조회를 담당합니다.

---

## 엔드포인트 목록

### 1. 내 즐겨찾기 목록 조회
- **Endpoint**: `GET /api/favorites`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `targetType` (`PROJECT` | `ISSUE` | `SPRINT` | `CHAT_CHANNEL`): 특정 타겟 필터
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "targetType": "ISSUE",
    "targetId": 101,
    "createdAt": "2026-09-01T00:00:00.000Z",
    "detail": {
      "id": 101,
      "title": "로그인 버그 수정"
    }
  }
]
```

---

### 2. 즐겨찾기 토글 (등록 / 해제)
- **Endpoint**: `POST /api/favorites/toggle`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "targetType": "ISSUE",
  "targetId": 101
}
```
- **Response (200 OK)**:
```json
{
  "message": "Favorite added",
  "isFavorite": true
}
```
