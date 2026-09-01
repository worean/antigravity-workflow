// -*- coding: utf-8 -*-
# 📅 Batch Schedules API (`/api/issues/batch-schedules`)

WBS나 Gantt 차트에서 여러 일감의 시작 계획일(`plannedStartDate`)과 마감일(`dueDate`)을 한 번의 요청으로 일괄 변경하는 서브 라우트입니다.

- **상위 라우트**: [`Issues API`](./README.md)
- **권한 요건**: `Bearer <token>` (프로젝트 멤버/PM)

---

## 엔드포인트 목록

### 1. 이슈 일정 일괄 갱신
- **Endpoint**: `PUT /api/issues/batch-schedules` (또는 `POST /api/issues/batch-schedules`)
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "items": [
    {
      "id": 101,
      "plannedStartDate": "2026-09-01",
      "dueDate": "2026-09-10"
    },
    {
      "id": 102,
      "plannedStartDate": "2026-09-11",
      "dueDate": "2026-09-20"
    }
  ]
}
```
- **Response (200 OK)**:
```json
{
  "updatedCount": 2,
  "issues": [
    { "id": 101, "plannedStartDate": "2026-09-01T00:00:00.000Z", "dueDate": "2026-09-10T00:00:00.000Z" },
    { "id": 102, "plannedStartDate": "2026-09-11T00:00:00.000Z", "dueDate": "2026-09-20T00:00:00.000Z" }
  ]
}
```
