// -*- coding: utf-8 -*-
# 😃 Chat Reactions API (`/api/chat/messages/:messageId/reactions`)

채팅 메시지에 이모지 반응(👍, ❤️, 🚀 등)을 토글하는 서브 라우트입니다.

- **상위 라우트**: [`Chat API`](./README.md)
- **권한 요건**: `Bearer <token>` (필수)

---

## 엔드포인트 목록

### 1. 메시지 이모지 리액션 토글
- **Endpoint**: `POST /api/chat/messages/:messageId/reactions`
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "emoji": "🚀"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Reaction toggled",
  "emoji": "🚀",
  "userId": 1
}
```
