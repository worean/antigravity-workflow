# 🧪 AntiGravity Backend Sub-Service 전체 단위 테스트 명세서

이 문서는 [`workflow_server`](file:///C:/Users/admin/antigravity-workflow/workflow_server)의 10개 전체 도메인 및 33개 Sub-Service 단위 테스트에 대한 구조, 검증 범위 및 세부 명세서입니다.

---

## 1. 📐 Sub-Service 단위 테스트 작성 표준 규칙 (Unit Testing Standards)

본 프로젝트의 모든 단위 및 통합 테스트 코드는 아래 3가지 원칙을 엄격히 준수하여 작성됩니다:

1. **테스트 파일 위치**: 모든 테스트 코드는 [`src/tests/`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests) 디렉터리 하위에 작성합니다.
2. **Sub-Service 단위 및 경우의 수(Use-Case) 검증**: 테스트 코드는 Sub-Service 단위로 1:1 매핑하여 작성하며, 해당 서비스에서 제공하는 다양한 성공, 실패, 예외, 경계 조건 등의 경우의 수(Use-Cases)에 맞춰 테스트를 진행합니다.
3. **파일명 명명 규칙**: `{domain}.{service}.test.ts` 파일명을 엄격히 준수합니다.
   - `domain`: 서비스가 속한 기능 범주 (예: `auth`, `users`, `projects`, `issues`, `comments`, `sprints`, `customFields`, `attachments`, `linkPreviews`, `worklogs`)
   - `service`: 대상 Sub-Service 파일 명칭 (예: `emailLogin`, `createProject`, `createIssue` 등)

---

## 2. 📁 10개 도메인 / 33개 Sub-Service 테스트 구축 현황

| # | 도메인 (`domain`) | Sub-Service (`service`) | 테스트 파일명 | 주요 검증 항목 (Use-Cases) |
|---|---|---|---|---|
| 1 | `auth` | `emailLogin` | [`auth.emailLogin.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/auth.emailLogin.test.ts) | 이메일/비밀번호 로그인 성공 JWT 토큰 발급, 미존재 계정 실패, 비밀번호 불일치 실패, 파라미터 누락 |
| 2 | `auth` | `googleLogin` | [`auth.googleLogin.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/auth.googleLogin.test.ts) | Google OAuth Access Token 로그인 및 소셜 회원가입, 파라미터 누락 예외 |
| 3 | `auth` | `googleCallback` | [`auth.googleCallback.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/auth.googleCallback.test.ts) | Authorization Code 콜백 수신 및 프론트엔드 JWT 토큰 리다이렉트(302) |
| 4 | `users` | `createUser` | [`users.createUser.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/users.createUser.test.ts) | 신규 회원가입 등록(201), 중복 이메일 가입 차단, 필수 파라미터 누락 |
| 5 | `users` | `getUsers` | [`users.getUsers.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/users.getUsers.test.ts) | 전체 사용자 목록 배열 성공 반환 |
| 6 | `users` | `getUser` | [`users.getUser.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/users.getUser.test.ts) | 특정 유저 ID 상세 조회, 존재하지 않는 유저 ID 404 예외 |
| 7 | `users` | `updateUser` | [`users.updateUser.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/users.updateUser.test.ts) | 사용자 정보 수정, 존재하지 않는 유저 ID 400 예외 |
| 8 | `users` | `deleteUser` | [`users.deleteUser.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/users.deleteUser.test.ts) | 사용자 계정 삭제(200 OK), 미존재 유저 삭제 400 예외 |
| 9 | `projects` | `createProject` | [`projects.createProject.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/projects.createProject.test.ts) | 토큰 유저 ID 동적 ownerId 및 ADMIN 멤버 자동 등록, 미인증 401, 필수키 누락 |
| 10 | `projects` | `getProjects` | [`projects.getProjects.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/projects.getProjects.test.ts) | 전체 프로젝트 목록 배열 반환 |
| 11 | `projects` | `getProject` | [`projects.getProject.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/projects.getProject.test.ts) | 단일 프로젝트 상세 정보 반환, 미존재 프로젝트 404 |
| 12 | `projects` | `updateProject` | [`projects.updateProject.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/projects.updateProject.test.ts) | 프로젝트 이름/설명 수정, 미존재 프로젝트 400 |
| 13 | `projects` | `deleteProject` | [`projects.deleteProject.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/projects.deleteProject.test.ts) | 프로젝트 삭제, 미존재 프로젝트 400 |
| 14 | `projects` | `addMember` | [`projects.addMember.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/projects.addMember.test.ts) | 프로젝트에 신규 멤버 역할(MEMBER) 추가(201), 파라미터 누락 |
| 15 | `issues` | `createIssue` | [`issues.createIssue.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/issues.createIssue.test.ts) | 이슈 생성(201) 및 순시 번호(issueNumber) 할당, 필수값 누락 |
| 16 | `issues` | `getIssues` | [`issues.getIssues.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/issues.getIssues.test.ts) | 전체 이슈 목록 배열 조회 |
| 17 | `issues` | `getIssue` | [`issues.getIssue.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/issues.getIssue.test.ts) | 단일 이슈 상세 정보 조회, 미존재 이슈 404 |
| 18 | `issues` | `updateIssue` | [`issues.updateIssue.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/issues.updateIssue.test.ts) | 이슈 제목/내용/진척도 수정, 미존재 이슈 400 |
| 19 | `issues` | `deleteIssue` | [`issues.deleteIssue.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/issues.deleteIssue.test.ts) | 이슈 삭제 성공, 미존재 이슈 400 |
| 20 | `issues` | `likeIssue` | [`issues.likeIssue.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/issues.likeIssue.test.ts) | 이슈 좋아요 토글(201), 미존재 이슈 400 |
| 21 | `comments` | `createComment` | [`comments.createComment.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/comments.createComment.test.ts) | 이슈에 댓글 생성(201), 필수값 누락 400 |
| 22 | `comments` | `getComments` | [`comments.getComments.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/comments.getComments.test.ts) | 특정 이슈 ID의 댓글 목록 반환 |
| 23 | `comments` | `deleteComment` | [`comments.deleteComment.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/comments.deleteComment.test.ts) | 댓글 삭제 성공, 미존재 댓글 400 |
| 24 | `comments` | `addReaction` | [`comments.addReaction.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/comments.addReaction.test.ts) | 댓글 이모지 리액션 추가(201), 파라미터 누락 |
| 25 | `sprints` | `createSprint` | [`sprints.createSprint.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/sprints.createSprint.test.ts) | 스프린트 생명주기 생성(201), 파라미터 누락 |
| 26 | `sprints` | `getSprints` | [`sprints.getSprints.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/sprints.getSprints.test.ts) | 프로젝트별 스프린트 목록 반환 |
| 27 | `sprints` | `updateSprint` | [`sprints.updateSprint.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/sprints.updateSprint.test.ts) | 스프린트 상태 변경(PLANNED ➔ ACTIVE), 미존재 400 |
| 28 | `customFields` | `createCustomField` | [`customFields.createCustomField.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/customFields.createCustomField.test.ts) | 동적 커스텀 필드 생성(201), key/name 누락 400 |
| 29 | `customFields` | `getCustomFields` | [`customFields.getCustomFields.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/customFields.getCustomFields.test.ts) | 커스텀 필드 정의 목록 조회 |
| 30 | `attachments` | `createAttachment` | [`attachments.createAttachment.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/attachments.createAttachment.test.ts) | 파일 메타데이터 및 URL 등록(201), 필수값 누락 400 |
| 31 | `linkPreviews` | `getLinkPreview` | [`linkPreviews.getLinkPreview.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/linkPreviews.getLinkPreview.test.ts) | URL 링크 메타데이터 파싱/조회 |
| 32 | `linkPreviews` | `saveLinkPreview` | [`linkPreviews.saveLinkPreview.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/linkPreviews.saveLinkPreview.test.ts) | 링크 프리뷰 캐시 DB 저장(201) |
| 33 | `worklogs` | `createWorklog` | [`worklogs.createWorklog.test.ts`](file:///C:/Users/admin/antigravity-workflow/workflow_server/src/tests/worklogs.createWorklog.test.ts) | 소요 작업시간(timeSpent) 기록(201) 및 이슈 자동 누적, 필수값 누락 |

---

## 🚀 3. 테스트 전체 실행 및 결과 확인

```bash
cd workflow_server
npm test
```

### 실행 검증 결과
```text
 Test Files  33 passed (33)
      Tests  68 passed (68)
   Duration  7.97s
```
