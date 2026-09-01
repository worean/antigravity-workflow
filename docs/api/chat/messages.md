// -*- coding: utf-8 -*-
# 📨 Chat Messages API (`/api/chat/channels/:channelId/messages`)

특정 채널의 메시지 히스토리 조회, 메시지 전송 및 읽음 처리를 담당하는 서브 라우트입니다.

- **상위 라우트**: [`Chat API`](./README.md)
- **권한 요건**: `Bearer <token>` (필수)

---

## 엔드포인트 목록

### 1. 채널 메시지 목록 조회
- **Endpoint**: `GET /api/chat/channels/:channelId/messages`
- **Auth**: `Bearer <token>`
- **Query Parameters**:
  - `limit` (number): 조회할 메시지 수 (기본: 50)
  - `beforeId` (number): 이전 메시지 페이징 ID
- **Response (200 OK)**:
```json
[
  {
    "id": 101,
    "channelId": 1,
    "senderId": 1,
    "content": "새로운 기능 배포 완료되었습니다.",
    "createdAt": "2026-09-01T00:00:00.000Z",
    "sender": { "id": 1, "name": "홍길동", "email": "hong@example.com" },
    "reactions": []
  }
]
```

---

### 2. 채널 메시지 전송
- **Endpoint**: `POST /api/chat/channels/:channelId/messages`
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "content": "검토 요청 드립니다!"
}
```
- **Response (201 Created)**: 생성된 메시지 객체

---

### 3. 채널 메시지 읽음 처리 (Mark as Read)
- **Endpoint**: `POST /api/chat/channels/:channelId/read`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**: `{ "success": true }`
