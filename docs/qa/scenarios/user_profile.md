# 📋 QA Test Case Specification: User Profile Extensions (사용자 프로필 확장)

## 1. Feature Overview (기능 개요)
- **Domain**: `users`
- **Target Page / Components**: [`SettingsPage.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/pages/SettingsPage.tsx), [`SettingsProfileTab.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/settings/SettingsProfileTab.tsx), [`ProfileCard.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/ProfileCard.tsx), [`ChatMemberSidebar.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/chat/ChatMemberSidebar.tsx)
- **Related API Spec**: [`docs/api/users/update_profile.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/users/update_profile.md)
- **Related FE Spec**: [`docs/components/users_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/users_COMPONENTS.md)

---

## 2. Test Cases Matrix (테스트 케이스 명세)

| TC ID | 분류 | 시나리오 요약 | 사전 조건 | UI/UX 조작 절차 | 기대 결과 (API & UI/UX) | 성공 기준 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PROF-01** | `Positive` | 자기 소개, 부서, 직책 정상 등록 및 저장 | 로그인 완료 상태 | 1. 설정 > 프로필 탭 이동<br>2. 부서('플랫폼개발팀'), 직책('시니어 엔지니어'), 자기소개 입력<br>3. '프로필 저장' 클릭 | • API `PUT /api/users/:id` 200 OK<br>• "프로필이 성공적으로 저장되었습니다." 토스트 표시<br>• 상태가 즉시 갱신되어 저장된 내용 유지 | Pass |
| **TC-PROF-02** | `Positive` | 좌측 ProfileCard에 부서/직책 배지 및 bio 툴팁 노출 | TC-PROF-01 완료 상태 | 1. 메인 화면 좌측 하단 ProfileCard 확인 | • 사용자 이름 옆에 `[플랫폼개발팀 · 시니어 엔지니어]` 배지 노출<br>• 하단에 자기소개 문구 노출 및 마우스 호버 시 전체 툴팁 표시 | Pass |
| **TC-PROF-03** | `Positive` | 채팅방 멤버 사이드바에 부서 및 직책 정보 노출 | 채팅방 진입 | 1. 채팅방 우측 멤버 목록 확인 | • 멤버 이름 아래에 `플랫폼개발팀 · 시니어 엔지니어` 서브텍스트 출력 | Pass |
| **TC-PROF-04** | `Positive` | 부서, 직책, 자기소개 필드 클리어 (빈 값 처리) | 프로필 입력된 상태 | 1. 부서, 직책, 자기소개 필드를 모두 지우고 '프로필 저장' 클릭 | • DB에 `null`로 정상 저장<br>• UI에서 오류나 깨짐 없이 기본 이름/이메일만 깔끔하게 노출 | Pass |
| **TC-PROF-05** | `Negative` | 필수값(사용자 이름) 누락 시 저장 차단 | 프로필 수정 모드 | 1. 사용자 이름을 공백으로 비우고 '프로필 저장' 클릭 | • '이름을 입력해주세요' 유효성 알림 출력 및 API 호출 차단 | Pass |
| **TC-PROF-06** | `Data Integrity` | Global DB 및 Workspace DB 데이터 동기화 검증 | 프로필 저장 완료 | 1. 백엔드 DB 레코드 조회 | • Global DB 및 Workspace DB 양쪽의 `User` 테이블에 `bio`, `department`, `jobTitle`이 동일하게 반영됨 | Pass |

---

## 3. Detailed Execution & Verification Log

### 🔹 TC-PROF-01 & TC-PROF-06 (API & DB 동기화 검증)
1. **Action**: `updateUserService` 호출 시 `globalPrisma.user.updateMany` 및 `prisma.user.update` 동시 수행.
2. **Verification**:
   - `[Backend Unit Test]` `src/tests/users.profile.test.ts` 3개 TC 100% 통과 완료 (`vitest`).
   - `[Frontend Reviewer]` `SettingsProfileTab.tsx` (310줄), `ProfileCard.tsx` (215줄), `ChatMemberSidebar.tsx` (116줄) 모두 400줄 미만 및 테마 규칙 준수 확인.
   - `[Production Build]` `workflow_react` `npm run build` 통과 완료.
