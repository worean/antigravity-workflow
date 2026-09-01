# 📢 Chat Channels API (`/api/chat/channels`)

채팅 채널(공개 채널, 프로젝트 전용 채널, 1:1 Direct Message) 목록 조회 및 생성을 담당하는 서브 라우트입니다.

- **상위 라우트**: [`Chat API`](./README.md)
- **권한 요건**: `Bearer <token>` (필수)

---

## 엔드포인트 목록

### 1. 내가 참여 중인 채널 목록 조회
- **Endpoint**: `GET /api/chat/channels`
- **Auth**: `Bearer <token>`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "일반 (General)",
    "type": "PUBLIC", // "PUBLIC" | "PROJECT" | "DIRECT"
    "projectId": null,
    "lastMessage": {
      "id": 50,
      "content": "안녕하세요!",
      "createdAt": "2026-09-01T00:00:00.000Z"
    },
    "unreadCount": 0
  }
]
```

---

### 2. 신규 채팅 채널 생성
- **Endpoint**: `POST /api/chat/channels`
- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "name": "백엔드 개발방",
  "type": "PUBLIC",
  "projectId": 1,
  "memberUserIds": [1, 2, 3]
}
```
- **Response (201 Created)**: 생성된 채널 객체
