# 📜 Activity Logs API (`/api/activity-logs`)

시스템 전반의 CRUD 활동 감사 로그(누가, 언제, 어떤 엔티티를 변경했는지) 조회를 담당합니다.

---

## 엔드포인트 목록

### 1. 활동 로그 목록 조회
- **Endpoint**: `GET /api/activity-logs`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `entityType` (`PROJECT` | `ISSUE` | `SPRINT` | `WORKSPACE` | `COMMENT`): 대상 타입
  - `entityId` (number): 대상 엔티티 ID
  - `userId` (number): 특정 사용자 필터
  - `limit` (number): 조회 개수 (기본 30)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "action": "CREATE",
    "entityType": "ISSUE",
    "entityId": 101,
    "userId": 1,
    "userName": "홍길동",
    "userEmail": "user@example.com",
    "summary": "이슈 #101 ('로그인 버그 수정') 생성",
    "details": "{\"title\": \"로그인 버그 수정\"}",
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```
