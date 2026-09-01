// -*- coding: utf-8 -*-
---
name: api-viewer
description: Docs(docs/api/) 및 백엔드 서버 소스(workflow_server/src/modules/)를 확인하여 각 API별 설명, 요청/응답 규격, 서브 라우트 구조 및 서비스 구현 소스를 분석하고 세부 동작을 확인하는 API 뷰어 에이전트 스킬입니다.
---

# 🔍 AntiGravity API Viewer Skill & Agent Guide

본 스킬은 AntiGravity 백엔드 REST API의 **명세 문서(`docs/api/`)**와 **실제 구현 소스 코드(`workflow_server/src/modules/`)**를 분석하여 API 스펙, DTO, 요청 파라미터, 인가 권한 및 Prisma 비즈니스 로직을 확인하고 프론트엔드 연동을 원활하게 지원하기 위한 뷰어 에이전트 가이드입니다.

---

## 🎯 주요 분석 대상

1. **API 명세 문서 계층 (`docs/api/`)**:
   - `docs/api/README.md`: 전체 라우트 맵, Base URL, JWT 인증 규격
   - 기본 도메인: `auth.md`, `users.md`, `tags.md`, `custom-fields.md`, `worklogs.md`, `attachments.md`, `link-previews.md`, `activity-logs.md`, `favorites.md`
   - 서브 라우트 복합 도메인:
     - `projects/` (`README.md`, `members.md`, `groups.md`)
     - `issues/` (`README.md`, `batch-schedules.md`, `reactions.md`)
     - `comments/` (`README.md`, `reactions.md`)
     - `sprints/` (`README.md`, `issues.md`, `discussions.md`, `worklogs.md`)
     - `groups/` (`README.md`, `members.md`)
     - `chat/` (`README.md`, `channels.md`, `messages.md`, `reactions.md`)
     - `workspaces/` (`README.md`, `members.md`, `invitations.md`)

2. **백엔드 소스 코드 (`workflow_server/src/modules/`)**:
   - `*.routes.ts`: HTTP Method, 엔드포인트 URL, 미들웨어(`requireAuth`, `requireProjectPM` 등)
   - `*.controller.ts`: 요청 데이터 파싱 및 응답 상태 코드
   - `services/*.service.ts`: Prisma 쿼리 로직, 필터링, 트랜잭션, 자동 연동 로직

---

## 🛠️ API Inspector CLI 도구 사용법 ([api_inspector.py](file:///C:/Users/admin/antigravity-workflow/.agents/skills/api-viewer/scripts/api_inspector.py))

Windows PowerShell/CMD 환경에서 한글 인코딩 깨짐을 방지하기 위해 `PYTHONUTF8=1` 설정을 포함하여 실행합니다.

### 1. 전체 도메인 및 라우트 목록 동적 조회
```powershell
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py list
```

### 2. 특정 도메인 / 서브 라우트 명세 및 소스 경로 조회
```powershell
# 기본 도메인 조회
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py get issues
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py get projects
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py get tags

# 서브 라우트 핀포인트 조회
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py get projects/members
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py get issues/batch-schedules
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py get sprints/discussions
```

### 3. 키워드 및 엔드포인트 검색
```powershell
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py search batch-schedules
$env:PYTHONUTF8=1; python .agents/skills/api-viewer/scripts/api_inspector.py search "#태그"
```

---

## 💡 API Viewer 에이전트의 역할 및 행동 수칙

1. **스펙 우선 확인**: 사용자가 특정 기능이나 API를 질문하면 `docs/api/`의 최신 마크다운 문서를 1차로 확인하여 표준 규격을 설명합니다.
2. **소스 코드 교차 검증**: 비즈니스 룰, 기본값, DB 유효성 검증 또는 사이드 이펙트(트랜잭션, 감사 로그, 태그 Upsert 등)가 궁금할 경우 `workflow_server/src/modules/{domain}/services/` 소스를 열람하여 정확한 구현 로직을 대조합니다.
3. **프론트엔드 연동 지원**: React 프론트엔드(`workflow_react/src/api/`)에서 사용할 수 있는 Axios/TanStack Query 훅 호출 코드와 DTO 타입 정의를 정확히 가이드합니다.
