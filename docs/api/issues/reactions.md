// -*- coding: utf-8 -*-
# ❤️ Issue Reactions & Likes API (`/api/issues/toggle-like`)

이슈에 대한 좋아요(Like) 등록 및 토글 처리를 담당하는 서브 라우트입니다.

- **상위 라우트**: [`Issues API`](./README.md)
- **권한 요건**: `Bearer <token>` (로그인 사용자)

---

## 엔드포인트 목록

### 1. 이슈 좋아요 토글 (Toggle Like)
- **Endpoint**: `POST /api/issues/toggle-like` (또는 `POST /api/issues/like`, `POST /api/issues/unlike`)
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "issueId": 101
}
```
- **Response (200 OK)**:
```json
{
  "message": "Liked successfully",
  "isLiked": true,
  "likesCount": 4
}
```
