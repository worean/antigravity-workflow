# 😀 Comment Reactions API (`/api/comments/:id/reactions`)

댓글에 이모지 반응(👍, ❤️, 🎉 등)을 추가하거나 취소(토글)하는 서브 라우트입니다.

- **상위 라우트**: [`Comments API`](./README.md)
- **권한 요건**: `Bearer <token>` (로그인 사용자)

---

## 엔드포인트 목록

### 1. 댓글 이모지 리액션 추가/토글
- **Endpoint**: `POST /api/comments/:id/reactions`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "emoji": "👍"
}
```
- **Response (200 OK)**:
```json
{
  "id": 1,
  "commentId": 1,
  "userId": 1,
  "emoji": "👍"
}
```
