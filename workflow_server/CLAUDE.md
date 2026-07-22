# 📌 AntiGravity Workflow System - Unified Agent Instructions

## 1. Project Context & Structure
이 프로젝트는 **이슈 및 일감 관리 시스템 (Issue & Task Management System)**의 백엔드 REST API 서버 프로젝트입니다:

- **`workflow_server/`**: Node.js + Express + TypeScript + Prisma ORM 기반의 백엔드 REST API 프로젝트

---

## 2. Backend Architecture & Coding Rules (`workflow_server/`)

### 2.1 3-Tier Layered Modular Architecture
모든 백엔드 기능 개발 및 추가 시 반드시 다음 3계층 아키텍처 규칙을 엄격히 준수해야 합니다.
- **Routes (`src/modules/{domain}/{domain}.routes.ts`)**: HTTP 라우팅 매핑 및 미들웨어 바인딩만 담당.
- **Controllers (`src/modules/{domain}/{domain}.controller.ts`)**: HTTP Request 파싱, Response 반환, 에러 캡처만 담당.
- **Sub-Services (`src/modules/{domain}/services/{action}.service.ts`)**: 단일 기능(Use-Case) 단위로 파일 분할(파일당 30~50줄). 순수 비즈니스 로직 및 Prisma DB 쿼리 전담 (Express 객체 사용 금지).

### 2.2 Security & Authentication Standards
- **Strict JWT Verification Only**: 사용자 신원은 오직 서버 암호 서명이 검증된 **JWT Access Token (`jwt.verify`)**의 payload.userId로만 인지해야 합니다. `req.body.userId` 등 임의의 입력 데이터 기반 유저 우회 인가 행위는 심각한 보안 취약점이므로 금지합니다.
- **Path Alias**: 상대 경로 대신 `#lib/prisma.js` 형태의 Subpath Imports를 사용합니다.

---

## 3. Sub-Service Unit Testing Standards (`src/tests/`)

신규 기능 개발 및 이슈 수정 시 다음 단위 테스트 작성 지침을 엄격히 준수해야 합니다:

1. **테스트 파일 위치**: 모든 테스트 코드는 `src/tests/` 디렉터리 하위에 작성합니다.
2. **Service 단위 및 경우의 수(Use-Case) 검증**: 테스트 코드는 Sub-Service 단위로 작성되며, 해당 서비스에서 제공하는 다양한 경우의 수(성공, 실패, 예외, 경계 조건 등)에 맞춰 테스트를 진행합니다.
3. **파일명 명명 규칙**: `{domain}.{service}.test.ts` 파일명을 엄격히 준수합니다.
   - `domain`: 서비스가 속한 범주 (예: `auth`, `projects`, `issues` 등)
   - `service`: 대상 서비스 기능 명칭 (예: `jwtAuth`, `createProject`, `emailLogin` 등)
   - **예시**: `src/tests/auth.jwtAuth.test.ts`, `src/tests/projects.createProject.test.ts`

---

## 4. Language & File Encoding Standards

- **한국어 우선**: 모든 질의응답 및 설명, 마크다운 문서는 한국어로 진행합니다.
- **UTF-8 with BOM**: 모든 소스 코드 및 마크다운 문서 파일은 `UTF-8 with BOM` (`utf-8-sig`) 인코딩으로 저장합니다. (단, JSON 파일 및 CLI 패키지 파일은 파싱 호환성을 위해 Plain UTF-8 적용)
- **Clickable File Links**: 대화 및 답변 시 파일 경로 언급할 때는 `[filename](file:///absolute/path/to/file)` 지침 준수.

---

## 5. Operating Principles

1. **Self-Annealing Loop**: 오류 및 컴파일 에러 발생 시 원인을 파악하여 자동 정정 테스트 후 보고합니다.
2. **Modular Scalability**: 신규 기능 추가 시 거대한 단일 서비스 파일에 추가하지 않고, `services/{newAction}.service.ts` 전담 서비스 파일로 생성하여 확장합니다.
