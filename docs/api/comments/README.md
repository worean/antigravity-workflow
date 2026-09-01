// -*- coding: utf-8 -*-
# 💬 Comments API (`/api/comments`)

이슈의 댓글 및 계층형 대댓글(Thread) 등록, 조회, 삭제를 담당합니다.

---

## 📌 서브 라우트 목차
- **[댓글 이모지 반응 (Reactions)](./reactions.md)**: `POST /api/comments/:id/reactions`

---

## 기본 CRUD 엔드포인트

### 1. 이슈별 댓글 목록 조회
- **Endpoint**: `GET /api/comments` 또는 `GET /api/comments/issue/:issueId`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `issueId` (number): 대상 이슈 ID
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "issueId": 101,
    "authorId": 1,
    "content": "이슈 해결 방안을 검토 중입니다.",
    "parentId": null,
    "createdAt": "2026-09-01T00:00:00.000Z",
    "author": { "id": 1, "name": "홍길동", "email": "hong@example.com" },
    "reactions": [],
    "children": [
      {
        "id": 2,
        "parentId": 1,
        "content": "빠른 처리 부탁드립니다!",
        "author": { "id": 2, "name": "이몽룡", "email": "lee@example.com" }
      }
    ]
  }
]
```

---

### 2. 댓글 / 대댓글 작성
- **Endpoint**: `POST /api/comments`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "issueId": 101,
  "content": "답글 내용입니다.",
  "parentId": 1 // 최상위 댓글일 경우 생략 또는 null
}
```
- **Response (201 Created)**: 생성된 댓글 객체

---

### 3. 댓글 삭제
- **Endpoint**: `DELETE /api/comments/:id`
- **Auth**: `Bearer <token>` (작성자 본인 또는 관리자)
- **Response (200 OK)**: `{ "message": "Comment deleted successfully" }`
