# 📌 AntiGravity Workflow System

**AntiGravity Workflow System**은 모던한 이슈 및 작업(Task) 관리, 프로젝트 트래킹, 스프린트 관리 및 작업 시간 기록(Worklog)을 지원하는 하이브리드 데스크톱 애플리케이션 및 REST API 서버 시스템입니다.

---

## 📂 프로젝트 구조 (Project Structure)

본 프로젝트는 모듈화된 멀티 패키지 구조로 구성되어 있으며, 세 가지 주요 디렉터리로 나뉘어 있습니다:

- 🟢 **[workflow_server](file:///C:/Users/admin/antigravity-workflow/workflow_server)**: Node.js + Express + TypeScript + Prisma ORM 기반의 백엔드 REST API 서버
- 🔵 **[workflow_electron](file:///C:/Users/admin/antigravity-workflow/workflow_electron)**: Electron + Vite + React + TypeScript 기반의 데스크톱 프론트엔드 애플리케이션
- 🟡 **[workflow 자동화 스크립트](file:///C:/Users/admin/antigravity-workflow/workflow%20자동화%20스크립트)**: 파이썬 데이터 수집 및 캘린더/워크플로우 자동화 스크립트 아카이브

---

## 🛠️ 기술 스택 (Tech Stack)

### 백엔드 (`workflow_server`)
- **Runtime & Framework**: Node.js, Express.js
- **Language**: TypeScript
- **Database & ORM**: SQLite, Prisma ORM (`schema.prisma`)
- **Authentication**: JWT (JSON Web Token), Google OAuth 연동
- **Development Tool**: `tsx` (TypeScript Execution)

### 프론트엔드 (`workflow_electron`)
- **Framework & Engine**: Electron, Vite, React 18
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Modern Dark Theme, Glassmorphism, Responsive UI)
- **Icons & Design**: Lucide React, Google Fonts (`Outfit` / `Inter`)

---

## 🔥 주요 기능 (Key Features)

1. **보안 인증 & 소셜 로그인**
   - JWT Access Token 기반의 엄격한 서명 검증 및 사용자 인가
   - Google 소셜 계정 연동 및 프로필 통합 관리
2. **이슈 및 일감 관리 (Issue Tracking)**
   - 이슈 상태(Todo, In Progress, Done 등), 우선순위, 이슈 타입별 세분화 관리
   - 담당자 지정, 마감일, 설명 및 작업 히스토리 추적
3. **프로젝트 & 마일스톤 & 스프린트**
   - 프로젝트 단위 목표 설정 및 마일스톤 연동
   - 애자일 스프린트 생명주기 관리
4. **커스텀 필드 & 첨부파일 & 링크 미리보기**
   - 동적 커스텀 필드 메타데이터 지원
   - 파일 첨부 기능 및 웹 링크 미리보기 제공
5. **작업로그 (Worklog) & 소통 기능**
   - 작업 시간(경과 시간) 기록 및 통계
   - 댓글 작성, 사용자 멘션(@) 및 리액션 지원
6. **데스크톱 전용 UI/UX**
   - Glassmorphism 기반의 세련된 다크 모드 인터페이스
   - 풍부한 마이크로 애니메이션 및 직관적인 반응형 레이아웃

---

## 🚀 설치 및 실행 방법 (Getting Started)

### 사전 요구사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18.0.0 이상 권장)
- npm (Node.js와 함께 설치됨)

---

### 1. 백엔드 서버 실행 (`workflow_server`)

```bash
# 백엔드 디렉터리로 이동
cd workflow_server

# 의존성 패키지 설치
npm install

# Prisma 데이터베이스 클라이언트 생성
npx prisma generate

# 개발 서버 실행 (기본 포트: http://localhost:4000)
npm run dev
```

#### 주요 백엔드 스크립트
- `npm run dev`: `tsx`를 통한 라이브 리로드 개발 서버 실행
- `npm run build`: TypeScript 소스 코드 컴파일 (`dist/`)
- `npm run start`: 프로덕션 빌드 실행 (`node dist/server.js`)
- `npm run prisma:generate`: Prisma Schema 변경사항 적용 및 클라이언트 생성

---

### 2. 프론트엔드 데스크톱 앱 실행 (`workflow_electron`)

```bash
# 프론트엔드 디렉터리로 이동
cd workflow_electron

# 의존성 패키지 설치
npm install

# Electron + Vite 개발 모드 동시 실행
npm run electron:dev
```

#### 주요 프론트엔드 스크립트
- `npm run electron:dev`: Vite 개발 서버와 Electron 앱을 동시에 실행 (`concurrently`)
- `npm run dev`: 웹 브라우저 단독 개발 서버 실행 (`http://localhost:5173`)
- `npm run build`: Vite 및 TypeScript 프로덕션 빌드

---

## 🏛️ 백엔드 아키텍처 규칙 (3-Tier Layered Architecture)

`workflow_server`의 기능 개발 시 아래의 계층적 모듈 아키텍처 규칙을 엄격히 준수합니다:

1. **Routes ([`src/modules/{domain}/{domain}.routes.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/modules))**: HTTP 라우팅 매핑 및 미들웨어 바인딩만 담당.
2. **Controllers ([`src/modules/{domain}/{domain}.controller.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/modules))**: Request 파싱, Response 반환, 에러 캐치 담당.
3. **Sub-Services ([`src/modules/{domain}/services/{action}.service.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/modules))**: 단일 Use-Case 단위 파일 분할 (30~50줄 내외). 비즈니스 로직 및 Prisma DB 쿼리 전담.

---

## 📜 개발 및 소스 코드 인코딩 지침

- **언어 기준**: 문서 및 소스 코드 제어 관련 소통은 **한국어**를 기본으로 작성합니다.
- **파일 인코딩**: 모든 소스 코드 및 마크다운 파일은 **`UTF-8 with BOM` (`utf-8-sig`)**으로 저장합니다. (단, `package.json` 등 CLI 전용 JSON 파일 제외)
- **Path Alias**: 상대 경로 대신 `#lib/prisma.js` 등의 Subpath Imports를 사용합니다.

---

## 📄 라이선스 (License)

본 프로젝트는 비공개/자체 프로젝트로 무단 전재 및 배포를 금지합니다.
