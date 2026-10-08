---
marp: true
theme: default
paginate: true
header: "Antigravity Multi-Agent & Skill 실전 개발 워크플로우"
footer: "AntiGravity Workflow 2.0 Tech Talk"
style: |
  section {
    font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
    padding: 38px 48px;
    background: #0f172a;
    color: #f8fafc;
  }
  h1 {
    color: #38bdf8;
    font-size: 1.85rem;
    margin-bottom: 0.4rem;
  }
  h2 {
    color: #818cf8;
    font-size: 1.45rem;
    border-bottom: 2px solid #334155;
    padding-bottom: 8px;
    margin-bottom: 1rem;
  }
  h3 {
    color: #cbd5e1;
    font-size: 1.15rem;
  }
  p, li {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #e2e8f0;
  }
  strong {
    color: #38bdf8;
  }
  code {
    background: #1e293b;
    color: #f43f5e;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.88rem;
  }
  pre {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
  }
  table {
    font-size: 0.82rem;
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  th {
    background: #1e293b;
    color: #38bdf8;
    padding: 8px;
    border: 1px solid #334155;
  }
  td {
    padding: 7px;
    border: 1px solid #334155;
    background: rgba(30, 41, 59, 0.4);
  }
  .highlight-box {
    background: rgba(56, 189, 248, 0.08);
    border-left: 4px solid #38bdf8;
    padding: 10px 16px;
    border-radius: 0 8px 8px 0;
    margin: 10px 0;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 14px;
  }
---

<!-- slide -->
# 🚀 Antigravity Multi-Agent & Skill 실전 개발 워크플로우

### "혼자 일하는 단일 AI를 넘어, 전문 분업화된 자율 개발팀으로"

<br/>

- **발표 주제**: Antigravity 에이전트/스킬 설계 구조, 병렬 협업 노하우 및 실전 적용기
- **핵심 목표**: AI 코딩 어시스턴트를 대규모 프로덕션 레벨 개발팀으로 확장하는 방법 습득
- **발표자**: AntiGravity 엔지니어링 팀

---

<!-- slide -->
## 1. 문제 제기: 단일 AI 어시스턴트의 한계

단일 거대 프롬프트나 단일 챗봇으로 풀스택 프로젝트를 개발할 때 마주치는 4대 장벽:

<div class="grid-2">
  <div class="card">
    <h3>❌ 컨텍스트 오염 (Context Pollution)</h3>
    <p>기획, DB, API, React 코드가 단일 대화방에 섞여 토큰이 급증하고 이전 지시사항을 망각하거나 환각(Hallucination) 발생</p>
  </div>
  <div class="card">
    <h3>❌ 영역 침범 사고 (Boundary Violation)</h3>
    <p>프론트엔드 작업 도중 백엔드 로직이나 DB 마이그레이션을 임의로 수정하여 기존 시스템이 깨지는 문제</p>
  </div>
  <div class="card">
    <h3>❌ 대형 파일 스파게티 코드</h3>
    <p>한 파일에 1,000줄 이상의 방대한 코드가 누적되어 유지보수가 불가능해지고 린트/빌드 에러 급증</p>
  </div>
  <div class="card">
    <h3>❌ 동기화 병목 (Sequential Blocking)</h3>
    <p>백엔드 API가 완성될 때까지 프론트엔드가 대기하는 직렬 구조로 인해 개발 속도가 지연</p>
  </div>
</div>

---

<!-- slide -->
## 2. 해결책: Antigravity 핵심 패러다임 (Agent vs Skill)

<div class="grid-2">
  <div class="card">
    <h3>🤖 Agent (전문가 페르소나)</h3>
    <ul>
      <li><strong>역할(Role)</strong>: 특정 직무만 전담 (기획자, BE, FE, QA 등)</li>
      <li><strong>런타임 격리</strong>: 독자적 <code>Workspace(branch/share)</code></li>
      <li><strong>모델 최적화</strong>: 복잡도에 따라 <code>pro</code> vs <code>flash</code> 분배</li>
      <li><strong>책임 경계(Ownership)</strong>: 허용된 디렉토리만 쓰기 가능</li>
    </ul>
  </div>
  <div class="card">
    <h3>🛠️ Skill (도구 및 실행 절차)</h3>
    <ul>
      <li><strong>재사용 도구함</strong>: 에이전트가 손에 쥐는 도구</li>
      <li><strong>지침(SKILL.md)</strong>: 도메인 특화 표준 절차/규칙</li>
      <li><strong>자동화 스크립트(scripts/)</strong>: 린터, 정적 분석기, 테스트기</li>
      <li><strong>템플릿(templates/)</strong>: 문서 양식 및 코드 표준</li>
    </ul>
  </div>
</div>

<div class="highlight-box">
💡 <strong>핵심 공식</strong>: <code>에이전트 = 전문 역할 + 작업 영역 격리</code> / <code>스킬 = 재사용 실행 도구 + 자동화 검증기</code>
</div>

---

<!-- slide -->
## 3. 우리 팀의 5대 전담 에이전트 (Ownership Matrix)

각 에이전트는 본인의 전문 도메인만 수정 권한을 가지며, 타 영역 수정을 엄격히 금지합니다.

| 에이전트 (`.agents/agents/`) | 런타임 설정 | 쓰기 권한 경로 (Write) | 읽기 참조 경로 (Read) | 절대 금지 작업 |
| :--- | :--- | :--- | :--- | :--- |
| **`spec-planner`** | `pro` / `inherit` | `docs/features/**` | 프로젝트 전체 | 소스 코드(`src/**`) 직접 수정 금지 |
| **`backend-developer`** | `pro` / `branch` | `workflow_server/**`, `docs/api/**` | `docs/features/**`, 서버 소스 | 프론트엔드(`workflow_react/**`) 수정 금지 |
| **`frontend-developer`** | `pro` / `branch` | `workflow_react/**`, `docs/components/**` | `docs/features/**`, 프론트 소스 | 백엔드(`workflow_server/**`) 수정 금지 |
| **`api-viewer`** | `flash` / `share` | `docs/api/**` (스펙 보완) | `docs/api/**`, 백엔드 모듈 | 비즈니스 로직 임의 수정 금지 |
| **`qa-tester`** | `flash` / `share` | `docs/qa/**`, `reports/**` | 프로젝트 전체 | 제품 코드 임의 수정 금지 |

---

<!-- slide -->
## 4. 5대 전담 스킬 (Specialized Skills) 매핑

에이전트들이 실무에서 즉시 활용하는 고도화된 스킬 묶음:

- 📋 **`feature-spec-writer`**: 사용자와의 인터뷰를 통해 요구사항을 체계적으로 수집하고 `spec_validator.py`로 정적 검증
- 🔍 **`api-spec-reader`**: `api_inspector.py`를 실행하여 문서와 서버 실제 소스 코드의 엔드포인트/파라미터 정합성 스캔
- ⚛️ **`react-component-developer`**: React 18 모듈러 컴포넌트, Zustand, Portal 팝업 개발 표준 가이드
- 🛡️ **`react-component-reviewer`**: `component_reviewer.py`를 통해 400줄 제한, Ghost State, 테마 색상 하드코딩 여부를 기계적으로 차단
- 🧪 **`scenario-qa-runner`**: Positive/Negative 시나리오를 바탕으로 풀스택 회귀 테스트를 자동 실행(`qa_runner.py`)

---

<!-- slide -->
## 5. End-to-End 파이프라인 (Phase 0 ~ Phase 3)

```
[Phase 0: 요구사항 기획]
  사용자 인터뷰 ➔ spec-planner (spec_validator.py PASS)
  산출물: DB 스키마 + REST API + UI 모듈 구조 + MOCK DATA 계약서
       │
       ▼ (SPEC_APPROVED: invoke_subagent 단일 호출 동시 발주)
┌────────────────────────────────────────────────────────┐
│ [Phase 1: Concurrent Dispatch 완전 병렬 동시 착수]      │
│  - BE Dev (Branch 격리): 3-Tier 모듈 구현 & Vitest Pass │
│  - FE Dev (Branch 격리): Max 400줄 UI 개발 (Mock 연동)   │
└────────────────────────────────────────────────────────┘
       │
       ▼ (BACKEND_API_COMPLETED)
[Phase 2: API 완성 & 브릿지 인계]
  api-viewer (api_inspector.py) ➔ 정합성 검증 ➔ FE 바인딩 가이드 & QA TC 전달
       │
       ▼ (FRONTEND_INTEGRATION_COMPLETED)
[Phase 3: QA-디버깅 자율 폐루프 & 서킷 브레이커]
  qa-tester (qa_runner.py --check-loop)
       ├─ 100% 통과 ➔ 🎉 SUCCESS 종합 리포트 자동 생성 & 배포 승인
       ├─ 에러 검출 (동일 에러 < 3회) ➔ 🔁 BE/FE 자동 디버깅 후 재검증
       └─ 동일 에러 3회 반복 ➔ 🚨 CIRCUIT BREAKER 발동 (중단 & 원인 리포트)
```

---

<!-- slide -->
## 6. Phase 0: 계약 기반 기획 (Contract-First Design)

### "코드를 작성하기 전에 완벽한 인터페이스 계약을 먼저 체결한다"

1. **사용자 인터뷰 프레임워크 (`feature-spec-writer`)**
   - 핵심 목적, 타겟 사용자, 데이터 스키마, 화면 와이어프레임 순서로 인터뷰 진행
2. **사양서 필수 4대 요소**:
   - ① **Prisma DB 모델 명세**: 모델명, 필드 타입, 관계, 인덱스
   - ② **REST API 명세**: HTTP Method, URL, Req/Res DTO, 상태 코드
   - ③ **UI 컴포넌트 분할 계획**: 파일별 400줄 이하 서브 컴포넌트 구조
   - ④ **MOCK DATA 계약 (`MOCK_[DOMAIN]_ITEMS`)**: 프론트엔드가 즉시 렌더링할 수 있는 완전한 더미 데이터
3. **자동화 검증 게이트**:
   - `python spec_validator.py` 통과 전까지는 Phase 1 착수 절대 불가

---

<!-- slide -->
## 7. Phase 1: Zero-Blocking 완전 병렬 개발

### "백엔드가 끝날 때까지 프론트엔드가 기다리지 않는다"

<div class="grid-2">
  <div class="card">
    <h3>🖥️ Backend Developer</h3>
    <ul>
      <li>독립 브랜치(<code>Workspace: branch</code>)에서 개발</li>
      <li><strong>3-Tier Layered 아키텍처</strong>: Routes ➔ Controllers ➔ Sub-Services (30~50줄 순수 비즈니스 로직)</li>
      <li>Vitest 단위 테스트 작성 (성공, 실패, 경계 조건)</li>
      <li><strong>Exit Criteria</strong>: <code>npm test</code> 100% Pass</li>
    </ul>
  </div>
  <div class="card">
    <h3>🎨 Frontend Developer</h3>
    <ul>
      <li>독립 브랜치에서 Mock Data를 기반으로 선행 UI 구현</li>
      <li>컴포넌트 400줄 제한 엄수 및 Sub-components 분할</li>
      <li>Zustand + TanStack Query 구조 사전 셋업</li>
      <li><strong>Exit Criteria</strong>: Mock 연동 완결 및 컴포넌트 리뷰 통과</li>
    </ul>
  </div>
</div>

---

<!-- slide -->
## 8. Phase 2: 브릿지 인계 프로토콜 (`api-viewer`)

### "문서와 소스 코드의 불일치를 사전에 원천 차단하는 중재자"

<div class="card">
  <h3>🔍 api_inspector.py 정합성 검증</h3>
  <p>백엔드가 완료 신호(<code>BACKEND_API_COMPLETED</code>)를 보내면 <code>api-viewer</code>가 소스 코드와 API 문서를 자동 비교 스캔합니다.</p>
</div>

- **프론트엔드에게 전달 (`API_SPECS_READY`)**:
  - TypeScript 인터페이스, 요청 파라미터 규격, TanStack Query 훅 권장 예제
  - 프론트엔드는 Mock Data를 주석 처리하고 실제 `src/api/{domain}.ts`를 5분 만에 바인딩!
- **QA 테스터에게 전달 (`QA_SPECS_READY`)**:
  - 엔드포인트 목록, HTTP 상태 코드 매트릭스(200 vs 400/401/403/404/409)
  - Negative TC 유효성 조건 및 데이터 정합성 검증 필수 필드

---

<!-- slide -->
## 9. Phase 3: 품질 검증 게이트 (Automated Quality Gates)

### "사람의 주관이 아닌, 스크립트 기반의 엄격한 Exit Criteria"

| 검증 단계 | 담당 도구 / 스크립트 | 통과 기준 (Exit Criteria) |
| :--- | :--- | :--- |
| **기획 사양서 검증** | `spec_validator.py` | 누락 섹션 0건 (DB, API, Mock 데이터 완비) |
| **API 정합성 검증** | `api_inspector.py get {domain}` | 소스 코드 - 문서 간 불일치 0건 |
| **컴포넌트 정적 분석** | `component_reviewer.py` | 400줄 초과 0건, Ghost State 0건, 테마 색상 하드코딩 0건 |
| **자율 폐루프 QA** | `qa_runner.py --check-loop` | 백엔드 테스트 + 프론트 빌드 통합 100% Pass |
| **서킷 브레이커** | `sameErrorCount >= 3` | 동일 에러 3회 반복 시 루프 강제 차단 & 보고서 출력 |
| **최종 승인 산출물** | `AUTONOMOUS_PIPELINE_REPORT.md` | 파이프라인 이력/원인 분석 종합 리포트 자동 발행 |

<div class="highlight-box">
💡 <strong>무한 루프 방지 서킷 브레이커</strong>: 에러 발생 시 시그니처 해시를 추출하여 동일 에러가 연속 3회 발생하면 자율 디버깅을 즉시 멈추고 상세 분석 보고서를 자동 생성합니다.
</div>

---

<!-- slide -->
## 10. 실전 사례 1: 워크스페이스 공유 메모장(`memos`) E2E 구축

### 30분 만에 기획부터 배포까지 완결된 실전 분업 사례

1. **기획 (`spec-planner`)**:
   - `08_SHARED_MEMO_SPECIFICATION.md` 작성 및 유효성 검증 완료
   - 요구사항: 마크다운 지원, 5MB 첨부파일, 워크스페이스 공개 토글, `@` 멘션 하이퍼링크 & 팝업 모달
2. **백엔드 (`backend-developer`)**:
   - Prisma DB 모델(`Memo`, `MemoAttachment`) 마이그레이션
   - 3-Tier 모듈 구현 및 단위 테스트 7개 100% Pass (`memos.service.test.ts`)
3. **프론트엔드 (`frontend-developer`)**:
   - 400줄 미만 서브 컴포넌트 6개로 분할 (`MemoCard`, `MemoDetailModal`, `MemoFormModal` 등)
   - 전역 멘션 팝업(`GlobalModalManager`) 및 테마 토큰 완벽 바인딩
4. **결과**: 상호 충돌이나 대기 없이 단 한 번에 Vite 빌드 및 Vitest 통과!

---

<!-- slide -->
## 11. 실전 사례 2: 복합 채팅 알림 고정 버그 추적 및 복구

### "실시간 채팅 알림 2개가 안 꺼져요" - 복합 시스템 원인 추적

<div class="grid-2">
  <div class="card">
    <h3>🔍 정밀 원인 규명</h3>
    <ul>
      <li>과거 자동 테스트 채널 2개가 DB에 잔여</li>
      <li>채널 타입이 <code>GENERAL</code>인데 프론트 트리에서 <code>GLOBAL</code>만 필터링하여 <strong>화면에 채널이 아예 안 보임!</strong></li>
      <li>읽음 처리 후 TanStack Query 캐시 무효화 누락으로 사이드바 뱃지 동기화 단절</li>
    </ul>
  </div>
  <div class="card">
    <h3>⚡ Full-Stack 해결 조치</h3>
    <ul>
      <li>잔여 테스트 채널 DB 정리 (unread = 0)</li>
      <li><code>WorkspaceChannelTree</code>에서 GENERAL 채널 렌더링 지원</li>
      <li>백엔드 <code>POST /api/chat/read-all</code> 구현 & 단위 테스트 Pass</li>
      <li>TanStack Query & 웹소켓 실시간 캐시 무효화</li>
      <li>채널 헤더에 <strong>[모두 읽음]</strong> 버튼 신설</li>
    </ul>
  </div>
</div>

---

<!-- slide -->
## 12. 에이전트 & 스킬 구축 핵심 노하우 (Best Practices)

### 💡 다른 팀에게 전수하는 4가지 실전 팁

1. **규칙을 말로만 쓰지 말고, 스크립트(Linter)로 만들어라**
   - "400줄 넘기지 마세요", "테마 변수 쓰세요" ➔ `component_reviewer.py`가 0 error일 때만 머지되도록 파이프라인 강제.
2. **에이전트에게 '금지 사항(Forbidden)'을 명확히 명시하라**
   - 백엔드 에이전트에게 "프론트엔드 파일 절대 수정 금지"를 못 박지 않으면, 편의상 프론트 코드를 임의 수정하여 협업이 깨집니다.
3. **파일 인코딩 및 디자인 토큰을 기계적으로 관리하라**
   - Windows 환경의 한글 깨짐 방지를 위해 `UTF-8 with BOM`을 자동 스크립트로 강제하고, 색상 하드코딩을 원천 차단.
4. **Mock Data 계약서가 병렬 개발의 치트키다**
   - 프론트엔드가 백엔드 API 완성을 기다릴 필요가 전혀 없어집니다.

---

<!-- slide -->
## 13. 도입 로드맵: 내 프로젝트에 적용하는 3단계

우리 팀의 프로젝트에 Multi-Agent 체계를 도입하는 실전 절차:

```
[Step 1: 아키텍처 규칙 정의 (GEMINI.md / AGENTS.md)]
  - 기술 스택, 레이어 규칙, 테마 토큰, 금지 사항 정의
       │
       ▼
[Step 2: 검증 스킬(Scripts) 패키징 (.agents/skills/)]
  - spec_validator.py (기획 검증)
  - component_reviewer.py (React/Vue 코드 규칙 검사)
  - qa_runner.py (API 및 시나리오 회귀 테스트)
       │
       ▼
[Step 3: 에이전트 분할 및 역할 격리 (.agents/agents/)]
  - Planner, Backend, Frontend, QA 에이전트 선언
  - Model(pro/flash) 및 Workspace(branch/share) 설정
```

---

<!-- slide -->
## 14. Q&A 및 핵심 질문 3선

### Q1. 에이전트를 너무 많이 나누면 토큰 비용이나 속도가 느려지지 않나요?
> **A**: 오히려 절약됩니다! 각 에이전트가 본인 도메인의 짧은 컨텍스트만 소비하고, 단순 조회 및 QA는 경량 모델(`flash`)을 배치하므로 단일 거대 모델보다 비용과 응답 속도 모두 훨씬 뛰어납니다.

### Q2. 프론트엔드가 Mock으로 개발하다가 나중에 API 바인딩할 때 안 맞으면 어쩌죠?
> **A**: Phase 0의 사양서에서 DTO 계약을 먼저 검증하고, Phase 2에서 `api-viewer`가 `api_inspector.py`로 실제 구현과 문서의 일치 여부를 사전 검증하므로 연동 실패율이 0%에 수렴합니다.

### Q3. 작은 프로젝트에서도 이 구조가 필요한가요?
> **A**: 최소 단위인 **[기획(Spec) ➔ 병렬 구현(BE/FE) ➔ QA 검증]** 3단계 규칙만 도입해도 AI 코딩의 환각과 스파게티 코드 문제를 90% 이상 예방할 수 있습니다.

---

<!-- slide -->
# 감사합니다! 👏

### "AI 에이전트와 함께하는 진정한 페어 프로그래밍 & 자율 개발팀"

<br/>

- **문서 저장소**: `docs/features/`, `docs/api/`, `docs/qa/`
- **에이전트 설정**: `.agents/agents/`
- **스킬 도구함**: `.agents/skills/`
- **프로젝트 가이드**: `GEMINI.md`
