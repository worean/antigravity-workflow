# 📋 QA Test Case Specification: {Domain Name}

## 1. Feature Overview (기능 개요)
- **Domain**: `{domain}` (예: projects, issues, wbs, chat 등)
- **Target Page / Component**: `{Page / Components}`
- **Related API Spec**: `docs/api/{domain}/{action}.md`
- **Related FE Spec**: `docs/components/{domain}_COMPONENTS.md`

---

## 2. Test Cases Matrix (테스트 케이스 명세)

| TC ID | 분류 | 시나리오 요약 | 사전 조건 | UI/UX 조작 절차 | 기대 결과 (API & UI/UX) | 성공 기준 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-{DOM}-01** | `Positive` | 정상 입력 시 등록 성공 | 로그인 완료, 프로젝트 접근 권한 보유 | 1. 모달 열기<br>2. 필수값 입력<br>3. '저장' 버튼 클릭 | • API `POST /api/...` 201 응답<br>• UI 리스트에 즉시 항목 렌더링<br>• DB에 데이터 영속 저장 | Pass |
| **TC-{DOM}-02** | `Negative` | 필수값 누락 시 유효성 에러 | 로그인 완료 | 1. 필수 필드 비워둔 채 '저장' 클릭 | • API 호출 방지 또는 400 Bad Request<br>• UI에 인라인 에러 문구 및 경고 표시<br>• 폼 제출 중단 | Pass |
| **TC-{DOM}-03** | `Negative` | 비인증/권한 부족 시 접근 차단 | 비로그인 또는 일반 멤버 상태 | 1. 관리자 전용 액션(삭제/설정 등) 시도 | • UI에서 버튼 비활성화 또는 로그인 모달 노출<br>• API 호출 시 401/403 응답<br>• "권한이 없습니다" 피드백 | Pass |
| **TC-{DOM}-04** | `Data Integrity` | 데이터 일치성 및 누락 검증 | 데이터 등록 완료 | 1. 상세 화면 진입<br>2. 각 필드 렌더링 확인 | • 백엔드 응답 필드(`isFavorite`, 상태, 날짜 등)가 UI에 100% 온전히 매핑되어 출력됨 | Pass |

---

## 3. Detailed Execution Steps (상세 실행 및 검증 로그)

### 🔹 TC-{DOM}-01: 정상 등록 플로우 (Positive)
1. **Pre-condition**: 테스트 계정 로그인 완료.
2. **Action**:
   - `[UI]` `{버튼명}` 클릭 -> 폼에 `{입력값}` 작성 -> `{저장}` 클릭.
3. **Verification**:
   - `[API Network]` `POST /api/...` ➔ Status 201 Created & Payload 확인.
   - `[UI Component]` 화면에 신규 생성된 데이터가 깜빡임 없이 즉시 반영되는지 확인.
   - `[Database]` SQLite DB 쿼리 실행 결과 레코드 생성 확인.

---

### 🔹 TC-{DOM}-02: 예외 처리 플로우 (Negative - 에러가 발생해야 정상)
1. **Pre-condition**: 로그인 완료.
2. **Action**:
   - `[UI]` 잘못된 형식 또는 공백 입력 후 제출.
3. **Verification**:
   - `[UI Feedback]` 화면이 멈추거나 백지화(White-screen)되지 않고, 명확한 에러 안내 모달/토스트가 표시되는지 확인.
   - `[API Network]` `ErrorCode.INVALID_INPUT` (400) 또는 클라이언트 사전 검증 성공 확인.
