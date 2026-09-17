# ⏱️ Sprint Worklogs API (`/api/sprints/:id/worklogs`)

스프린트에 포함된 이슈들의 총 작업 소요 시간 및 팀원별 작업 기여도를 집계하는 서브 라우트입니다.

- **상위 라우트**: [`Sprints API`](./README.md)
- **권한 요건**: 선택적 (`optionalAuth`)

---

## 엔드포인트 목록

### 1. 스프린트 작업 시간 통계 및 로그 집계 조회
- **Endpoint**: `GET /api/sprints/:id/worklogs`
- **Auth**: 선택적 (`optionalAuth`)
- **Response (200 OK)**:
```json
{
  "sprintId": 1,
  "totalMinutes": 480,
  "totalHours": 8.0,
  "worklogs": [
    {
      "id": 1,
      "issueId": 101,
      "issueTitle": "로그인 API 지연 개선",
      "userName": "홍길동",
      "timeSpentMinutes": 180,
      "description": "JWT 검증 튜닝",
      "createdAt": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```
