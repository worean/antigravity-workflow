# 🧪 AntiGravity Workflow - Quality Assurance (QA) Master Hub

AntiGravity Workflow 시스템의 **UI/UX 조작과 백엔드 REST API 연동을 포괄하는 전체 도메인 시나리오 테스트 케이스(Test Cases)** 및 품질 검증 관리 허브입니다.

---

## 🎯 QA 테스트 정책 및 검증 원칙

1. **포괄적 시나리오 (Positive & Negative TCs)**:
   - 모든 도메인은 정상 동작(Positive)뿐만 아니라 **"의도된 에러가 올바르게 발생하고 사용자에게 적절한 UI 피드백이 표시되는지"** 확인하는 실패/예외 케이스(Negative)를 반드시 포함합니다.
2. **데이터 정합성 및 누락 검증 (Data Integrity)**:
   - 백엔드 DB/API에서 제공하는 데이터(예: `isFavorite`, 진척도, 담당자 정보 등)가 프론트엔드 UI 컴포넌트까지 유실 없이 온전히 전달되고 렌더링되는지 점검합니다.
3. **자동화 회귀 검증 (Regression Verification)**:
   - `python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --run-all` 명령을 통해 백엔드 단위 테스트, 프론트엔드 모듈화 린터, 프로덕션 빌드를 원클릭으로 통합 검증합니다.

---

## 📂 Domain Test Scenarios Index (도메인별 시나리오 테스트 목록)

| 도메인 | 대상 컴포넌트 & API | 시나리오 사양서 문서 링크 | 핵심 검증 포인트 | 상태 |
| :--- | :--- | :--- | :--- | :--- |
| **Projects (프로젝트)** | `ProjectDetailPage`, `GET /api/projects/:id` | [`docs/qa/scenarios/projects.md`](file:///C:/Users/admin/antigravity-workflow/docs/qa/scenarios/projects.md) | 즐겨찾기(isFavorite) 연동, 권한별(PM) 수정/삭제, 중복 키 에러 검증 | ✅ Pass |
| **WBS (간트 차트)** | `WBSPage`, `IssueDetailDrawer`, Batch Schedule API | [`docs/qa/scenarios/wbs.md`](file:///C:/Users/admin/antigravity-workflow/docs/qa/scenarios/wbs.md) | 간트 바/트리 행 클릭 시 독립 드로어 오픈, 드래그 일정 연동, 날짜 역전 방지 | ✅ Pass |

---

## 🚀 QA Runner 실행 명령어

```bash
# 1. QA 테스트 시나리오 사양서 정적 검사
python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --verify-docs

# 2. 전체 풀스택 통합 회귀 테스트 실행
python .agents/skills/scenario-qa-runner/scripts/qa_runner.py --run-all
```
