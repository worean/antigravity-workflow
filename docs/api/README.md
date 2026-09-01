// -*- coding: utf-8 -*-
# 🌐 AntiGravity Backend REST API Overview

## 1. 개요
AntiGravity 백엔드 서버는 **Node.js + Express + TypeScript + Prisma ORM** 기반의 3-Tier 모듈형 REST API 서버입니다.

- **Base URL**: `http://localhost:5000/api` (개발 환경 기준)
- **인증 방식**: JWT Bearer Token (`Authorization: Bearer <token>`)
- **데이터 포맷**: `Content-Type: application/json`

---

## 2. 공통 응답 & 에러 규격

### 성공 응답 (200, 201)
```json
{
  "id": 1,
  "name": "Project Name",
  "createdAt": "2026-09-01T00:00:00.000Z"
}
```

### 실패 응답 (400, 401, 403, 404, 500)
```json
{
  "error": "구체적인 오류 메시지"
}
```

---

## 3. 도메인별 API 라우팅 맵

| 도메인 | 기본 경로 | 하위 라우트 디렉터리 | 주요 설명 |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth` | [`auth.md`](./auth.md) | 구글/이메일 로그인 및 세션 검증 |
| **Users** | `/api/users` | [`users.md`](./users.md) | 사용자 프로필, 설정, CRUD |
| **Projects** | `/api/projects` | [`projects/`](./projects/README.md) | 프로젝트 및 멤버/부서/스프린트 연동 |
| **Issues** | `/api/issues` | [`issues/`](./issues/README.md) | 일감 CRUD, 일괄 일정, 좋아요/태그 |
| **Comments** | `/api/comments` | [`comments/`](./comments/README.md) | 댓글/대댓글 트리 및 이모지 반응 |
| **Sprints** | `/api/sprints` | [`sprints/`](./sprints/README.md) | 스프린트, 이슈 할당, 토론, 작업 집계 |
| **Groups** | `/api/groups` | [`groups/`](./groups/README.md) | 부서/조직도 계층 구조 및 멤버 매핑 |
| **Chat** | `/api/chat` | [`chat/`](./chat/README.md) | 실시간 채널, 메시지, 리액션 |
| **Workspaces** | `/api/workspaces` | [`workspaces/`](./workspaces/README.md) | 멀티테넌트 워크스페이스, 초대 링크 |
| **Tags** | `/api/tags` | [`tags.md`](./tags.md) | `#태그` 목록, 사용 통계, CRUD |
| **Worklogs** | `/api/worklogs` | [`worklogs.md`](./worklogs.md) | 작업 시간(Mins/Hours) 기록 |
| **Custom Fields**| `/api/custom-fields` | [`custom-fields.md`](./custom-fields.md) | 동적 사용자 정의 필드 스키마 |
| **Attachments** | `/api/attachments` | [`attachments.md`](./attachments.md) | 파일 첨부 및 다운로드 |
| **Link Previews**| `/api/link-previews`| [`link-previews.md`](./link-previews.md) | URL OpenGraph 메타데이터 파싱 |
| **Activity Logs**| `/api/activity-logs`| [`activity-logs.md`](./activity-logs.md) | 활동 감사 로그 조회 |
| **Favorites** | `/api/favorites` | [`favorites.md`](./favorites.md) | 일감/프로젝트/채널 즐겨찾기 |
