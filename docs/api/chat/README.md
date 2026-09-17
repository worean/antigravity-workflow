# 💬 Chat & Realtime Messaging API (`/api/chat`)

프로젝트 및 팀 협업을 위한 실시간 채팅 채널, 메시지 송수신, 읽음 처리 및 이모지 반응 API입니다.

---

## 📌 서브 라우트 목차
- **[채널 관리](./channels.md)**: `GET/POST /api/chat/channels`
- **[메시지 송수신 및 읽음 처리](./messages.md)**: `GET/POST /api/chat/channels/:channelId/messages`, `POST /read`
- **[메시지 이모지 리액션](./reactions.md)**: `POST /api/chat/messages/:messageId/reactions`

---

## 공통 권한 요건
- 모든 채팅 API는 유효한 JWT Access Token (`Authorization: Bearer <token>`)이 필요합니다.
