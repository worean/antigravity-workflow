# 💬 Sprint Discussions API (`/api/sprints/:id/discussions`)

스프린트에 할당된 모든 이슈들의 댓글 및 논의 내용을 한눈에 집계하여 조회하는 서브 라우트입니다.

- **상위 라우트**: [`Sprints API`](./README.md)
- **권한 요건**: 불필요 (또는 `Bearer <token>`)

---

## 엔드포인트 목록

### 1. 스프린트 전체 논의/댓글 집계 조회
- **Endpoint**: `GET /api/sprints/:id/discussions`
- **Auth**: 선택적 (`optionalAuth`)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "issueId": 101,
    "issueTitle": "로그인 API 지연 개선",
    "content": "성능 튜닝 완료했습니다.",
    "authorName": "홍길동",
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```
