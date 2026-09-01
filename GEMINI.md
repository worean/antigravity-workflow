# 📌 AntiGravity Workflow System - Unified Agent Instructions

## 1. Project Context & Reference Architecture
이 프로젝트는 **이슈 및 일감 관리 시스템 (Issue & Task Management System)**의 풀스택 웹 애플리케이션입니다:
- **`workflow_server/`**: Node.js + Express + TypeScript + Prisma ORM 기반 백엔드 REST API
- **`workflow_react/`**: React 18 + TypeScript + Vite + TanStack Query 기반 프론트엔드 SPA

> **📖 상세 아키텍처 참조 (필요 시 선택적 열람)**:
> 세부 디렉토리 구조, 데이터 모델 및 설계 명세는 필요할 때 아래 전담 문서를 참조합니다.
> - **백엔드 아키텍처**: [`docs/BACKEND_ARCHITECTURE.md`](file:///C:/Users/admin/antigravity-workflow/docs/BACKEND_ARCHITECTURE.md)
> - **프론트엔드 아키텍처**: [`docs/FRONTEND_ARCHITECTURE.md`](file:///C:/Users/admin/antigravity-workflow/docs/FRONTEND_ARCHITECTURE.md)
> - **프론트엔드 기능/디자인 명세**: [`docs/FRONTEND_SPECIFICATION.md`](file:///C:/Users/admin/antigravity-workflow/docs/FRONTEND_SPECIFICATION.md), [`docs/FRONTEND_DESIGN_SYSTEM.md`](file:///C:/Users/admin/antigravity-workflow/docs/FRONTEND_DESIGN_SYSTEM.md)
> - **REST API 도메인 명세**: [`docs/api/README.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/README.md)

---

## 2. Core Development Standards

### 2.1 Backend Coding Standards (`workflow_server/`)
- **3-Tier Layered Architecture**: Routes (미들웨어 바인딩) ➔ Controllers (DTO 파싱/응답 직렬화) ➔ Sub-Services (순수 비즈니스 로직 및 Prisma 쿼리 전담, 30~50줄).
- **Strict JWT Verification**: 사용자 신원은 오직 암호 검증된 JWT Access Token (`jwt.verify` -> `payload.userId`)으로만 인지 (임의 `userId` 바디 입력 우회 인가 금지).
- **Subpath Imports**: 상대 경로 대신 `#lib/prisma.js` 등의 Path Alias 사용.

### 2.2 Frontend Coding Standards (`workflow_react/`)
- **Server State (TanStack Query v5)**: `placeholderData: (previousData) => previousData` 적용으로 데이터 페칭 깜빡임 방지, `setQueriesData` 기반 In-place 캐시 즉시 갱신 (Optimistic Updates), 불필요한 전체 리마운트(key 강제 변경) 지양.
- **Draft Persistence (`draftStorage.ts`)**: 600ms 디바운스 자동 임시 저장 및 페이지 재진입 시 복원 배너 제공.
- **Design Tokens**: CSS Variables 기반 다크 모던 테크(VS Code / Linear 스타일) 테마 및 색상 시스템 준수.

---

## 3. Sub-Service Unit Testing Standards (`src/tests/`)
1. **테스트 파일 위치**: `workflow_server/src/tests/` 하위 작성.
2. **Use-Case 검증**: Sub-Service 단위로 성공, 실패, 예외, 경계 조건 케이스를 포괄 검증.
3. **파일명 명명 규칙**: `{domain}.{service}.test.ts` (예: `src/tests/auth.jwtAuth.test.ts`, `src/tests/tags.getTags.test.ts`).

---

## 4. Language & File Encoding Standards
- **한국어 우선**: 모든 질의응답, 문서 및 설명은 한국어로 진행합니다.
- **UTF-8 with BOM**: 모든 소스 코드 및 마크다운 문서는 `UTF-8 with BOM` (`utf-8-sig`) 인코딩으로 저장합니다 (JSON 등 예외).
- **Clickable Links**: 파일 경로 언급 시 `[filename](file:///absolute/path/to/file)` 포맷을 준수합니다.

---

## 5. Operating Principles
1. **Self-Annealing Loop**: 오류 발생 시 원인 분석 ➔ 자동 정정 ➔ 테스트 검증 후 보고합니다.
2. **Modular Scalability**: 신규 기능 추가 시 거대 단일 파일 지양, `services/{action}.service.ts` 단위 파일 분할로 확장합니다.

---

## 6. Custom Agents & Skills Architecture
- **Agents (`.agents/agents/`)**:
  - `frontend-developer`: React 18 + Vite + TS + TanStack Query 기반 프론트엔드(`workflow_react/`) 전담 개발자 에이전트.
  - `backend-developer`: Node.js + Express + TS + Prisma ORM 기반 백엔드(`workflow_server/`) 전담 개발자 에이전트.
  - `api-viewer`: `docs/api/` 및 백엔드 도메인 소스(`workflow_server/src/modules/`)를 분석하여 API 설명 및 세부 구현 동작을 안내하는 전담 뷰어 에이전트.
- **Skills (`.agents/skills/`)**:
  - `api-spec-reader`: `docs/api/` 폴더를 실시간 스캔(Auto-Discovery)하고 `api_inspector.py`를 통해 API 엔드포인트/도메인 정보를 핀포인트로 조회/검색하는 실행 기술(Skill).
