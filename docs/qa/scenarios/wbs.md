# 📋 QA Test Case Specification: WBS Gantt Chart (WBS 및 간트 차트)

## 1. Feature Overview (기능 개요)
- **Domain**: `wbs`
- **Target Page / Components**: [`WBSPage.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/pages/WBSPage.tsx), [`WBSGanttBar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/wbs/WBSGanttBar.tsx), [`WBSTreeRow.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/wbs/WBSTreeRow.tsx)
- **Related API Spec**: `docs/api/issues/updateIssue.md`, `docs/api/issues/batchUpdateIssueSchedules.md`
- **Related FE Spec**: `docs/components/wbs_COMPONENTS.md`

---

## 2. Test Cases Matrix (테스트 케이스 명세)

| TC ID | 분류 | 시나리오 요약 | 사전 조건 | UI/UX 조작 절차 | 기대 결과 (API & UI/UX) | 성공 기준 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-WBS-01** | `Positive` | 간트 차트 바 및 좌측 트리 행 클릭 시 이슈 상세 드로어 오픈 | 프로젝트 내 이슈 등록됨, WBS 탭 진입 | 1. 간트 차트의 타임라인 바 또는 좌측 작업명 행 클릭 | • URL Hash 변경 없이 WBS 내부 전용 우측 슬라이드 오버레이(`IssueDetailDrawer`)가 즉시 열림<br>• WBS 스크롤 및 줌 상태가 100% 보존됨 | Pass |
| **TC-WBS-02** | `Positive` | 간트 바 드래그 시 일정 자동 이동 및 하위 일감 연동 | 부모 및 자식 일감 존재 | 1. 부모 일감 바를 마우스로 잡고 우측으로 3일 이동 | • 드래그 중 실시간 날짜 툴팁 표시<br>• 마우스 릴리즈 시 `batchUpdateIssueSchedules` 호출 및 하위 자식 일감 일정 일괄 반영<br>• 드로어가 오작동으로 열리지 않음 | Pass |
| **TC-WBS-03** | `Negative` | 역전된 날짜 입력 시(시작일 > 기한) 일정 수정 차단 | 간트 바 리사이즈 모드 | 1. 좌측 시작일 리사이즈 핸들을 우측 기한일보다 뒤로 드래그 | • 시작일이 기한일을 초과하여 역전되지 않도록 자동 스냅 제한<br>• 비정상 날짜 API 요청 차단 | Pass |
| **TC-WBS-04** | `Negative` | 계층 트리 드래그 시 순환 참조(자손을 부모로 설정) 방지 | 다단계 계층 일감 존재 | 1. 상위 부모 일감을 드래그하여 자신의 하위 자식 이슈 속으로 드롭 시도 | • 드롭 타겟 감지 차단 (`descendantIds.has(targetId)`)<br>• 순환 참조 발생 원천 방지 및 UI 원위치 유지 | Pass |
| **TC-WBS-05** | `Data Integrity` | 드로어에서 이슈 수정 시 WBS 간트 차트 즉시 동기화 | WBS 드로어 오픈 상태 | 1. 드로어에서 진척도(100%) 또는 제목 변경 후 저장 | • `loadProjectData(false)`가 호출되어 WBS 화면의 간트 바 너비 및 % 라벨이 즉시 리프레시됨 | Pass |

---

## 3. Detailed Execution & Verification Log

### 🔹 TC-WBS-01 (WBS 전용 Colocation 드로어 검증)
1. **Action**: `WBSPage`에서 이슈 클릭 시 `selectedDrawerIssueId`를 설정하여 로컬 `<IssueDetailDrawer>` 오픈.
2. **Verification**:
   - `[Browser URL]` 브라우저 주소창의 해시가 `#/wbs`로 완벽히 유지됨.
   - `[UI Overlay]` WBS 화면 위에 부드럽게 우측 드로어가 슬라이드되어 나타남.
