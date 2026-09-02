---
name: scenario-qa-runner
description: 프론트엔드 UI/UX 조작과 실제 백엔드 API 연동을 결합한 통합 시나리오 테스트 케이스(Positive/Negative TCs)를 작성하고, 데이터 정합성 및 에러 핸들링을 검증하는 전담 QA 실행 기술(Skill)입니다.
---

# 🧪 Scenario QA Runner Skill (`scenario-qa-runner`)

프론트엔드 화면(UI/UX)과 백엔드 REST API 간의 **실제 데이터 정합성, 시나리오 흐름, 예외/에러 케이스(Negative TC)**를 체계적으로 검증하는 전담 QA 기술(Skill)입니다.

---

## 🎯 핵심 역할 및 검증 기준

1. **포괄적 테스트 케이스(TC) 설계 및 관리**:
   - **정상 케이스 (Positive TC)**: 올바른 UI 조작 및 데이터 입력 시 API 성공(200/201), 화면 렌더링 반영 및 DB 저장 확인.
   - **예외/실패 케이스 (Negative TC)**: 유효하지 않은 입력, 비로그인/권한 부족(RBAC), 중복 데이터 발생 시 **"의도된 에러가 올바르게 발생하고 UI에 명확한 에러 피드백(토스트/경고 모달)이 출력되는지"** 검증.
2. **UI/UX ➔ API ➔ DB 데이터 일치성 검증**:
   - 프론트엔드 컴포넌트에 출력되는 필드(예: `isFavorite`, 날짜, 진척도, 상태 등)가 백엔드 API 응답 및 DB 스키마와 1:1로 일치하는지, 누락된 데이터가 없는지 확인.
3. **통합 테스트 자동화 파이프라인**:
   - 백엔드 Vitest 단위/통합 테스트 + 프론트엔드 정적 분석 + 빌드 검증을 통합 수행.

---

## 📂 테스트 케이스(TC) 관리 디렉토리 규격

- **테스트 케이스 사양서**: `docs/qa/scenarios/{domain}.md`
- **마스터 QA 인덱스**: `docs/qa/README.md`

---

## 🚀 사용법 및 실행 도구 (Usage)

### 1. QA 테스트 시나리오 정적 검사 및 헬스체크
```bash
python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --verify-docs
```

### 2. 전체 풀스택 회귀 테스트 일괄 실행 (백엔드 단위테스트 + 프론트 빌드 + 컴포넌트 검사)
```bash
python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --run-all
```
