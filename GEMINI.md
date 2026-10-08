# 📌 Full-Stack Web Application - Unified Agent Guide

## 1. Reference Architecture & Core Standards
- **Backend (`workflow_server/`)**: Node.js + Express + TypeScript + Prisma ORM
  - **3-Tier Layered**: Routes ➔ Controllers ➔ Sub-Services (순수 비즈니스/Prisma 쿼리 전담, 30~50줄).
  - **Strict JWT**: Access Token 암호 검증(`payload.userId`) 기반 신원 식별.
  - **Subpath Imports**: `#lib/prisma.js` 등 Path Alias 사용.
- **Frontend (`workflow_react/`)**: React 18 + Vite + TypeScript + TanStack Query (SPA)
  - **Sub-Component Modular (Max 400줄)**: 대형 UI는 `src/components/{domain}/` 서브 컴포넌트로 분할 (`index.ts` 필수).
  - **상태 관리**: Server State(TanStack Query v5), Client State(Zustand 5.x 개별 셀렉터), Session Context(인증/테넌트).
  - **Modal/Popup**: 전역 모달(`useUIStore` + Portal), 페이지 모달(`useState` Colocation + `ModalWrapper` Portal). Ghost State 금지.
  - **LocalStorage**: 접두사 필수(`app_`, `ag_`), `safeStorage.ts` 또는 Zustand `persist` 사용.
  - **Theme & CSS Tokens**: 색상 하드코딩 금지. 반드시 `src/styles/theme.css`의 시맨틱 CSS 변수(`var(--bg-card)`, `var(--text-main)` 등) 사용. 인라인 스타일 색상 직접 지정 금지.

## 2. Testing, Encoding & Roles
- **Unit Tests**: `src/tests/{domain}.{service}.test.ts` (Vitest 100% Pass 필수).
- **Encoding & Links**: 한국어 우선, `UTF-8 with BOM` (`utf-8-sig`) 저장, Windows forward-slash 링크(`[file](file:///...)`).
- **Agent Roles**:
  - `spec-planner` (`pro`/`inherit`): `docs/features/**` 전담 기획 (코드 수정 금지).
  - `backend-developer` (`pro`/`branch`): `workflow_server/**`, `docs/api/**` 전담.
  - `frontend-developer` (`pro`/`branch`): `workflow_react/**`, `docs/components/**` 전담.
  - `api-viewer` (`flash`/`share`): `docs/api/**` 규격 정합성 분석/보완.
  - `qa-tester` (`flash`/`share`): `docs/qa/**`, 풀스택 회귀 테스트 전담.

## 3. Autonomous Multi-Agent Workflow (4-Phase Lifecycle)
1. **Phase 0 (기획)**: `spec-planner`가 요구사항 수집 및 사양서(`docs/features/`) 작성 ➔ `spec_validator.py` 통과 (`SPEC_APPROVED`).
2. **Phase 1 (동시 병렬 개발)**:
   - **Orchestrator**가 `[backend-developer, frontend-developer]`를 단일 `invoke_subagent`로 동시 런칭.
   - **BE**: Prisma 스키마 & REST API 구현, Vitest 단위 테스트 Pass (`BACKEND_API_COMPLETED`).
   - **FE**: 사양서 Mock Data 기반 UI 서브 컴포넌트(Max 400줄) 선행 개발.
3. **Phase 2 (브릿지 연동)**:
   - `api-viewer`가 `api_inspector.py`로 정합성 검증 후 DTO/Hook 규격 전달 (`API_SPECS_READY`).
   - **FE**: 실제 API 바인딩 완료 (`FRONTEND_INTEGRATION_COMPLETED`).
4. **Phase 3 (자율 폐루프 QA & 서킷 브레이커)**:
   - `qa-tester`가 `qa_runner.py --check-loop` 실행 (BE 테스트 + 컴포넌트 린트 + Vite 빌드 검증).
   - 결함 검출 시 책임 에이전트로 라우팅하여 자동 수정 루프 진행.
   - **서킷 브레이커**: 동일 에러 3회 반복 시 루프를 즉시 중단하고 원인 보고서 발행 후 사용자 에스컬레이션.
