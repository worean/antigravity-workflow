# 📅 GET /api/calendar/events

워크스페이스 내의 일정(이슈 시작일/마감일 및 스프린트 일정)을 캘린더 포맷으로 통합 조회합니다.

---

## 1. 기본 정보 (Endpoint Details)
- **Method**: `GET`
- **Path**: `/api/calendar/events`
- **인증**: 필요 (`Bearer <JWT Token>`)
- **Query Parameters**:
  - `projectId` (선택, number): 특정 프로젝트의 일정만 필터링
  - `startDate` (선택, string/ISO): 조회 시작 일시 (범위 필터링)
  - `endDate` (선택, string/ISO): 조회 종료 일시 (범위 필터링)

---

## 2. 요청 예시 (Request Example)
```http
GET /api/calendar/events?projectId=1&startDate=2026-09-01T00:00:00.000Z&endDate=2026-09-30T23:59:59.999Z HTTP/1.1
Host: localhost:4000
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

## 3. 응답 규격 (Response Format)

### 성공 응답 (200 OK)
```json
{
  "events": [
    {
      "id": "issue-101",
      "issueId": 101,
      "title": "캘린더 뷰 레이아웃 컴포넌트 구현",
      "description": "월간 및 주간 뷰 지원",
      "startDate": "2026-09-15T00:00:00.000Z",
      "endDate": "2026-09-20T18:00:00.000Z",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "type": "issue",
      "project": {
        "id": 1,
        "name": "Frontend Core",
        "key": "FC"
      },
      "assignee": {
        "id": 10,
        "name": "홍길동",
        "avatar": null
      }
    },
    {
      "id": "sprint-3",
      "sprintId": 3,
      "title": "[스프린트] 2026 Q3 스프린트 #2",
      "startDate": "2026-09-10T00:00:00.000Z",
      "endDate": "2026-09-24T23:59:59.999Z",
      "status": "ACTIVE",
      "type": "sprint",
      "project": {
        "id": 1,
        "name": "Frontend Core",
        "key": "FC"
      }
    }
  ]
}
```

---

## 4. 에러 응답
- **401 Unauthorized**: 인증 토큰 누락 또는 만료
```json
{
  "error": "Unauthorized: Authentication token is required"
}
```
