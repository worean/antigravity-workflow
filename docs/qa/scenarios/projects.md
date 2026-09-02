# 📋 QA Test Case Specification: Projects (프로젝트 관리 및 상세)

## 1. Feature Overview (기능 개요)
- **Domain**: `projects`
- **Target Page / Components**: [`ProjectDetailPage.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/pages/ProjectDetailPage.tsx), [`ProjectDetailHeader.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/projectDetail/ProjectDetailHeader.tsx)
- **Related API Spec**: `docs/api/projects/getProject.md`, `docs/api/projects/updateProject.md`
- **Related FE Spec**: `docs/components/projectDetail_COMPONENTS.md`

---

## 2. Test Cases Matrix (테스트 케이스 명세)

| TC ID | 분류 | 시나리오 요약 | 사전 조건 | UI/UX 조작 절차 | 기대 결과 (API & UI/UX) | 성공 기준 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PROJ-01** | `Positive` | 프로젝트 상세 조회 및 즐겨찾기(isFavorite) 상태 렌더링 | 로그인 완료, 대상 프로젝트 존재 (즐겨찾기 등록 상태) | 1. 프로젝트 상세 페이지 진입 (`#/projects/1`) | • API `GET /api/projects/1` 호출 시 `{ isFavorite: true }` 반환<br>• 상단 헤더의 별표(★) 아이콘이 노란색으로 활성화 렌더링됨 | Pass |
| **TC-PROJ-02** | `Positive` | 프로젝트 상세 헤더에서 즐겨찾기 토글 | 로그인 완료 | 1. 상단 별표(★) 클릭 | • API `POST /api/favorites/toggle` 200 응답<br>• 별표 색상이 즉시 반전(활성 ➔ 비활성 또는 비활성 ➔ 활성)<br>• 토스트/피드백 정상 제공 | Pass |
| **TC-PROJ-03** | `Negative` | 비로그인(Guest) 상태에서 즐겨찾기 클릭 시 로그인 모달 유도 | 비로그인(토큰 없음) | 1. 프로젝트 상세 헤더의 별표(★) 클릭 | • API 요청 차단<br>• 로그인 유도 모달(`AuthModal`)이 화면에 즉시 팝업됨 | Pass |
| **TC-PROJ-04** | `Negative` | 일반 멤버가 PM 전용 기능(수정/삭제) 시도 시 차단 | 프로젝트 일반 멤버 계정으로 로그인 | 1. 프로젝트 상세 페이지 진입 | • 화면에 '프로젝트 수정' 및 '삭제' 버튼이 노출되지 않음<br>• URL 또는 API로 `PUT /api/projects/:id` 직접 호출 시 403 Forbidden 반환 | Pass |
| **TC-PROJ-05** | `Negative` | 프로젝트 이름 또는 키 필수값 누락 시 유효성 에러 | PM 권한으로 수정 모드 진입 | 1. 프로젝트 이름 필드를 공백으로 비우고 '저장' 클릭 | • API 호출 방지 또는 400 Bad Request<br>• "프로젝트 이름을 입력해주세요" 경고 피드백 표시 | Pass |
| **TC-PROJ-06** | `Data Integrity` | 프로젝트 상세 메타데이터 누락 검증 | 프로젝트 생성 완료 (멤버, 그룹, 상태, 태그 포함) | 1. 상세 페이지 로드 | • `owner`, `members`, `groups`, `status`, `tags`, `isFavorite` 데이터가 화면 카드에 유실 없이 100% 매핑됨 | Pass |

---

## 3. Detailed Execution & Verification Log

### 🔹 TC-PROJ-01 & TC-PROJ-02 (즐겨찾기 데이터 정합성 검증)
1. **Action**: `getProjectService` 호출 시 `currentUserId` 기반으로 `prisma.favorite` 조회.
2. **Verification**:
   - `[Backend]` `GET /api/projects/:id` ➔ 응답 JSON에 `isFavorite: true/false` 필드 포함 확인.
   - `[Frontend]` `ProjectDetailHeader`의 `<FavoriteButton>`에 `isFavorite={project.isFavorite}`가 올바르게 주입되어 별표가 표시됨 확인.
