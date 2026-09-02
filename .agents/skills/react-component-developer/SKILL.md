---
name: react-component-developer
description: React 컴포넌트, 페이지, 훅, 컨텍스트 및 라이브러리 개발 표준 절차(디렉토리 규격, API 스펙 분석, 기능 설계, 서브 컴포넌트 모듈화 구현, 지정 산출물 생성)를 안내하는 전담 개발 스킬입니다.
---

# ⚛️ React Component Developer Skill (`react-component-developer`)

본 스킬은 AntiGravity Workflow 프론트엔드(`workflow_react/`)에서 새로운 UI/UX 기능을 개발하거나 컴포넌트를 확장할 때 준수해야 하는 **표준 디렉토리 규격**, **5단계 기능 개발 파이프라인(Feature Development Pipeline)** 및 **단계별 지정 산출물/소스 생성 표준**을 제공합니다.

---

## 📂 1. 표준 디렉토리 아키텍처 및 역할 정의

```text
workflow_react/src/
├── components/   # 실제 tsx 파일들로 이루어진 도메인별 React UI 컴포넌트
├── pages/        # 여러 컴포넌트를 조합하여 화면을 구성하는 레이아웃 및 순수 오케스트레이터
├── hooks/        # UI 기능, 액션 피드백 및 API 통신 전담 Custom React Hooks
├── context/      # useContext 등을 활용한 전역 세션/테넌트 상태 관리
├── lib/          # 여러 컴포넌트/훅에서 공통으로 사용되는 핵심 인프라 (apiClient, queryClient 등)
├── api/          # TanStack Query 훅 및 백엔드 REST API 통신 모듈
├── types/        # TypeScript DTO 및 데이터 모델 인터페이스 정의
└── utils/        # draftStorage(임시저장), 날짜/색상 포맷터 등 순수 유틸리티
```

### 디렉토리별 세부 책임
1. **`src/components/`**:
   - `common/`: 재사용 공통 UI (`Button`, `Card`, `Badge`, `ModalWrapper` 등).
   - `{domain}/` (`kanban/`, `issueDetail/`, `settings/`, `chat/` 등): 도메인 전담 컴포넌트.
   - **400줄 제한**: 단일 컴포넌트가 400줄을 초과하지 않도록 서브 컴포넌트(Sub-components)로 역할을 쪼개어 구성.
2. **`src/pages/`**:
   - React Router 진입점 페이지로, 복잡한 렌더링 JSX 대신 **서브 컴포넌트 배치 및 데이터 오케스트레이션(Pure Orchestrator)**만 전담.
3. **`src/hooks/`**:
   - UI 인터랙션, 모달 닫기, 액션 피드백(`useActionFeedback`), 데이터 가공 커스텀 훅.
4. **`src/context/`**:
   - 전역 상태(`AuthContext`, `WorkspaceContext`) 관리 및 로컬 즉시 동기화 메서드(`updateUserLocal` 등) 제공.
5. **`src/lib/`**:
   - `apiClient.ts` (Axios 인터셉터), `queryClient.ts` (TanStack Query 설정), `prefRepository.ts` (사용자 설정 저장소).

---

## 📋 2. 5단계 기능 개발 파이프라인 및 지정 산출물 (Pipeline & Deliverables)

모든 프론트엔드 기능 개발 및 컴포넌트 추가/수정 시, 에이전트와 스킬은 반드시 다음 **5단계 파이프라인**을 거쳐 지정된 산출물(Documents)과 소스 코드(Source Codes)를 생성합니다.

```mermaid
flowchart TD
    S1[1단계: UI/UX 입출력 데이터 & 타입 정의] --> S2[2단계: 백엔드 API 연동 스펙 확인]
    S2 --> S3[3단계: 도메인 컴포넌트 설계 사양서 산출물 생성]
    S3 --> S4[4단계: TSX/TS 소스 코드 서브 모듈화 구현]
    S4 --> S5[5단계: react-component-reviewer 검증 및 빌드 QA]
```

### 단계별 상세 가이드 및 지정 생성 산출물

| 단계 | 주요 작업 내용 | 필수 생성/수정 대상 산출물 | 투입 도구 및 스킬 |
| :--- | :--- | :--- | :--- |
| **1단계: I/O 정의** | UI 화면 표시 데이터(Output) 및 사용자 폼 입력 데이터(Input) 모델링 | `src/types/{domain}.ts` 또는 `src/types/index.ts` | TypeScript 인터페이스 |
| **2단계: API 확인** | 백엔드 REST API 엔드포인트, DTO 규격, 인증 미들웨어 연동 가능 여부 확인 | `docs/api/{domain}/` 명세 확인 (부재 시 백엔드 스펙 요청) | `api-spec-reader` |
| **3단계: 사양서 산출물** | 컴포넌트 계층도, Props I/O, 상태 라이프사이클, 캐싱 정책 명세서 작성 | `docs/components/{domain}_COMPONENTS.md`<br>+ `docs/FRONTEND_SPECIFICATION.md` 인덱스 갱신 | 마크다운 설계 사양서 |
| **4단계: 소스 구현** | API 통신 훅, 서브 컴포넌트 분할(Max 400줄), 순수 오케스트레이터 페이지 작성 | `src/api/{domain}.ts`<br>`src/components/{domain}/*` (Max 400줄 + `index.ts`)<br>`src/pages/{Domain}Page.tsx` | TSX/TS 소스 코드 |
| **5단계: 품질 검증** | 400줄 제한 준수, Ghost State 0건, 모달 Colocation 및 빌드 검증 | 검증 리포트 (0 errors 확인) | `react-component-reviewer`<br>`npm run build` |

---

## 🛠️ 3. 컴포넌트 구현 표준 및 코딩 규칙 (Implementation Standards)

1. **React 공식 권장 사양 준수**:
   - 함수형 컴포넌트 (`React.FC<Props>`) 및 엄격한 TypeScript Props 타이핑.
2. **서브 컴포넌트 모듈화 (Max 400줄)**:
   - 비대해진 단일 컴포넌트 금지, 기능 블록 단위로 `src/components/{domain}/` 하위 파일로 분할.
   - 도메인 하위 컴포넌트들은 반드시 `src/components/{domain}/index.ts`를 통해 re-export.
3. **Modal Colocation & Ghost State 금지**:
   - 모달/드로어는 해당 도메인 서브 컴포넌트 내부에 배치하거나 JSX 트리에 마운트 필수.
   - `const [, setX] = useState(...)` 형태의 언팩 린트 묵살 패턴 절대 금지.
4. **TanStack Query Smooth Cache Update**:
   - `placeholderData: (previousData) => previousData`로 깜빡임 제거.
   - `setQueriesData` In-place 즉시 갱신 및 불필요한 전체 리마운트(key 강제 변경) 지양.
5. **Draft Persistence (`draftStorage.ts`)**:
   - 폼 입력 시 600ms 디바운스 자동 임시 저장 및 복원 배너 연동.
6. **품질 검증 (QA & Build)**:
   - `react-component-reviewer` 스킬 실행 (0 errors).
   - `npm run build` 검증 (0 errors).
