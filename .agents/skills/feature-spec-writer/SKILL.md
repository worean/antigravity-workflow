---
name: feature-spec-writer
description: 사용자와의 인터뷰를 통해 요구사항을 체계적으로 수집하고 FEATURE_SPEC_TEMPLATE.md 양식에 맞춰 완결된 기능 기획 사양서를 생성하며 spec_validator.py로 검증하는 전담 기술(Skill)입니다.
---

# 📝 Feature Specification Writer Skill

사용자의 아이디어를 체계적인 엔지니어링 기획서로 변환하고, [FEATURE_SPEC_TEMPLATE.md](file:///C:/Users/admin/antigravity-workflow/docs/features/FEATURE_SPEC_TEMPLATE.md) 표준 양식에 맞추어 **Phase 1(병렬 동시 착수)**에 즉시 투입 가능한 완결된 사양서 문서를 작성 및 검증하는 **전담 기술(Skill)**입니다.

---

## 🛠️ 핵심 도구 및 참조 가이드

1. **사양서 정적 검증기 ([scripts/spec_validator.py](./scripts/spec_validator.py))**:
   - 기획서 문서 내 필수 섹션(1~6), Prisma 모델 코드 블록, API 명세 테이블, 400줄 서브 컴포넌트 분할 계획, Mock Data 샘플, QA TC(Positive/Negative) 작성 여부를 정적으로 검사합니다.
   ```powershell
   $env:PYTHONUTF8=1; python .agents/skills/feature-spec-writer/scripts/spec_validator.py docs/features/06_EXAMPLE_SPECIFICATION.md
   ```

2. **사용자 인터뷰 프레임워크 ([references/INTERVIEW_GUIDE.md](./references/INTERVIEW_GUIDE.md))**:
   - 사용자에게 부담 없는 5단계(개요 ➔ 유저 여정 ➔ 데이터 ➔ UI/모달 ➔ 예외 케이스) 질의응답을 진행하여 누락 없는 스펙을 도출합니다.

---

## 📋 기획서 작성 및 검증 표준 프로세스

```mermaid
flowchart TD
    I[1. 인터뷰 진행 (INTERVIEW_GUIDE.md)] --> W[2. 사양서 초안 작성 (docs/features/NN_...md)]
    W --> V[3. 정적 유효성 검증 (spec_validator.py)]
    V -->|오류 발생 시| F[4. 누락 항목 보완 & 재검증]
    F --> V
    V -->|통과| D[5. Phase 1 착수 준비 완료 (BE/FE 인계)]
```

### 1단계: 사용자 인터뷰
- `INTERVIEW_GUIDE.md`의 질문 세트를 활용하여 사용자의 의도, 데이터 항목, UI 레이아웃, 예외 동작을 파악합니다.
- 사용자가 구체적인 기술 스펙(예: Prisma 필드 타입, HTTP 응답 구조 등)을 정하지 않은 경우, AntiGravity 아키텍처 원칙([GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md))에 따라 에이전트가 최적의 표준 스펙을 제안하고 기획서에 반영합니다.

### 2단계: 사양서 문서 작성
- **저장 위치**: `docs/features/NN_[FEATURE_NAME]_SPECIFICATION.md`  
  *(예: `docs/features/06_NOTIFICATIONS_SPECIFICATION.md`, `docs/features/07_EXPORT_SPECIFICATION.md`)*
- **인코딩 원칙**: `UTF-8 with BOM` (`utf-8-sig`) 필수 준수.
- **반드시 포함되어야 하는 6대 필수 항목**:
  1. 기능 개요 & 사용자 권한 스코프 (Core vs Workspace)
  2. 데이터 모델 (`schema.prisma` 코드 블록, 필드 제약조건 테이블, Cascade 정책)
  3. 백엔드 REST API 규격 (Action/Method/URL 테이블, Request/Response JSON 샘플, 에러 코드)
  4. 프론트엔드 UI/UX 사양 (URL 라우트, **400줄 제한 서브 컴포넌트 목록**, 모달/Portal 정책, **Mock Data**)
  5. QA 시나리오 (Positive & Negative TC 매트릭스)
  6. Phase 1~3 산출물 체크리스트

### 3단계: 정적 유효성 검증 실행
- 작성이 완료되면 `spec_validator.py`를 실행하여 누락된 필수 섹션이나 미완성 플레이스홀더(`[TODO]`, `[기능명]` 등)가 없는지 검증합니다:
  ```powershell
  $env:PYTHONUTF8=1; python .agents/skills/feature-spec-writer/scripts/spec_validator.py docs/features/NN_[FEATURE_NAME]_SPECIFICATION.md
  ```
- 검증 결과 `[PASS]` 또는 `[PERFECT]`가 확인되면 사용자에게 최종 기획서를 공유하고 완료를 보고합니다.
