// -*- coding: utf-8 -*-
---
name: api-spec-analyzer
description: 백엔드 REST API 명세 문서(docs/api/) 및 서버 소스 코드(workflow_server/src/modules/)를 체계적으로 분석하여 API 규격, 요청/응답 DTO, 인증 요구사항 및 세부 비즈니스 로직을 확인하고 프론트엔드 연동 개발을 지원하는 스킬입니다.
---

# 🚀 AntiGravity API Spec & Source Analyzer Skill

이 스킬은 AntiGravity 프로젝트의 **백엔드 REST API 명세 문서(`docs/api/`)** 및 **실제 백엔드 서버 소스 코드(`workflow_server/src/modules/`)**를 분석하여 프론트엔드 및 클라이언트 개발 시 API를 원활하게 확인하고 연동할 수 있도록 돕습니다.

---

## 🎯 주요 분석 대상 및 구조

1. **API 명세 문서 계층 (`docs/api/`)**:
   - `docs/api/README.md`: 전체 라우트 맵, Base URL, JWT 인증, 공통 에러 응답 규격.
   - 단일 도메인: `auth.md`, `users.md`, `tags.md`, `custom-fields.md`, `worklogs.md`, `attachments.md`, `link-previews.md`, `activity-logs.md`, `favorites.md`.
   - 복합 서브 라우트 도메인:
     - `projects/` (`README.md`, `members.md`, `groups.md`)
     - `issues/` (`README.md`, `batch-schedules.md`, `reactions.md`)
     - `comments/` (`README.md`, `reactions.md`)
     - `sprints/` (`README.md`, `issues.md`, `discussions.md`, `worklogs.md`)
     - `groups/` (`README.md`, `members.md`)
     - `chat/` (`README.md`, `channels.md`, `messages.md`, `reactions.md`)
     - `workspaces/` (`README.md`, `members.md`, `invitations.md`)

2. **백엔드 3-Tier 소스 코드 (`workflow_server/src/modules/`)**:
   - **Routes (`*.routes.ts`)**: HTTP Method, URL 매핑, 미들웨어 (`requireAuth`, `requireProjectMember`, `requireProjectPM` 등) 검증.
   - **Controllers (`*.controller.ts`)**: Request DTO 파싱, HTTP 상태 코드 및 응답 반환.
   - **Sub-Services (`services/*.service.ts`)**: Prisma ORM DB 쿼리 및 순수 비즈니스 로직.

---

## 🛠️ Python CLI 헬퍼 사용법 ([api_inspector.py](file:///C:/Users/admin/antigravity-workflow/.agents/skills/api-spec-analyzer/scripts/api_inspector.py))

### 1. 전체 도메인 및 라우팅 계층 목록 조회
```bash
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py list
```

### 2. 특정 도메인의 API 명세 및 소스 경로 조회
```bash
# 기본 도메인 명세 조회
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py get issues
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py get projects
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py get tags

# 특정 서브 라우트 핀포인트 조회
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py get projects/members
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py get issues/batch-schedules
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py get sprints/discussions
```

### 3. 엔드포인트 또는 키워드 핀포인트 검색
```bash
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py search batch-schedules
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py search "#태그"
python .agents/skills/api-spec-analyzer/scripts/api_inspector.py search toggle-like
```

---

## 💡 API 분석 및 프론트엔드 연동 가이드라인

1. **인증 헤더 확인**:
   - 대부분의 엔드포인트는 `Authorization: Bearer <JWT Token>`이 필요합니다.
2. **DTO 인터페이스 동기화**:
   - 프론트엔드 `workflow_react/src/types/index.ts` 및 `workflow_react/src/api/{domain}.ts`에 정의된 필드가 백엔드 Controller / Prisma 스키마와 일치하는지 확인합니다.
3. **소스 교차 검증**:
   - API 명세서에 기재된 기본 설명 외에 조건부 필터링(`where`), 정렬(`orderBy`), 자동 생성 트리거(예: 태그 자동 Upsert, 활동 로그 기록 등)의 세부 동작은 `workflow_server/src/modules/{domain}/services/{action}.service.ts`를 직접 열람하여 검증합니다.
