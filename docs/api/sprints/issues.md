# 🎯 Sprint Issues Assignment API (`/api/sprints/:id/issues`)

백로그 이슈들을 특정 스프린트로 할당하거나 제외하는 서브 라우트입니다.

- **상위 라우트**: [`Sprints API`](./README.md)
- **권한 요건**: `Bearer <token>` (필수)

---

## 엔드포인트 목록

### 1. 스프린트에 이슈 할당 (Assign Issues)
- **Endpoint**: `POST /api/sprints/:id/issues` (또는 `PUT /api/sprints/:id/assign-issues`)
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "issueIds": [101, 102, 103]
}
```
- **Response (200 OK)**:
```json
{
  "message": "Issues successfully assigned to sprint",
  "sprintId": 1,
  "assignedCount": 3
}
```
