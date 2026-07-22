# 🚀 Antigravity 자동화 워크플로우 시스템

이 프로젝트는 루리웹 RSS 피드 키워드 수집기, Google Calendar 일정 감시/리마인더, 그리고 **하이브리드 태스크 관리(SQLite + Notion + Google Calendar 연동) 도구**로 구성된 3-Layer Architecture 기반의 자동화 워크플로우 모음입니다.

모든 소스 코드와 문서 파일은 한글 호환성을 위해 **UTF-8 with BOM** 인코딩을 준수하여 작성되었습니다.

---

## 📂 프로젝트 구성

```text
antigravity-workflow/
│
├── .agents/
│   └── skills/
│       └── task-calendar-manager/     # 커스텀 에이전트 태스크-캘린더 관리 스킬
│           └── SKILL.md
│
├── directives/                        # Layer 1: 표준 운영 지침서 (SOP)
│   ├── collect_ruliweb_rss.md         # 루리웹 수집기 SOP 지침
│   ├── google_calendar_reminder.md    # 구글 캘린더 리마인드 SOP 지침
│   ├── google_calendar_create.md      # [NEW] 구글 캘린더 일정 추가 SOP 지침
│   ├── google_calendar_update.md      # [NEW] 구글 캘린더 일정 수정/완료 SOP 지침
│   ├── google_calendar_delete.md      # [NEW] 구글 캘린더 일정 삭제 SOP 지침
│   ├── google_calendar_restore.md     # [NEW] 구글 캘린더 일정 복원 SOP 지침
│   ├── google_calendar_crud.md        # (폐기됨) 기존 통합 CRUD 지침
│   └── task_hybrid_management.md      # 하이브리드 태스크 관리 SOP 지침
│
├── execution/                         # Layer 3: 실행 스크립트
│   ├── collect_ruliweb_rss.py         # 루리웹 수집기 파이썬 엔진
│   ├── google_calendar_reminder.py    # 구글 캘린더 리마인드 파이썬 엔진
│   ├── google_calendar_create.py      # [NEW] 구글 캘린더 일정 추가 엔진
│   ├── google_calendar_update.py      # [NEW] 구글 캘린더 일정 수정/완료 엔진
│   ├── google_calendar_delete.py      # [NEW] 구글 캘린더 일정 삭제 및 아카이빙 엔진
│   ├── google_calendar_restore.py     # [NEW] 구글 캘린더 삭제 일정 복원 엔진
│   ├── google_calendar_crud.py        # (폐기됨) 기존 통합 CRUD 엔진
│   ├── create_notion_dbs.py           # [NEW] 노션 Projects & Milestones DB 생성 및 연동 스크립트
│   ├── task_cli.py                    # 하이브리드 태스크 등록 CLI 클라이언트
│   ├── task_repository.py             # 로컬 SQLite 및 Notion DB 저장소 모듈 (Project/Milestone/Comment 지원 확장)
│   ├── task_service.py                # 비즈니스 로직 서비스 모듈
│   ├── calendar_common.py             # 구글 캘린더 공통 유틸리티
│   └── initialize_db.py               # 로컬 SQLite DB 초기화 및 시딩 스크립트
│
├── .env                               # 환경 설정 파일
├── schema.prisma                      # 로컬 DB 스키마 정의 (Prisma)
├── run_ruliweb_collector.sh           # 루리웹 수집기 실행 쉘 스크립트
└── README.md                          # 본 시스템 안내 문서 (현재 파일)
```

---

## 🛠️ 사전 준비 사항

### 1. 의존성 라이브러리 설치
터미널 또는 PowerShell을 열어 필요한 외부 라이브러리들을 설치해 주십시오.

```powershell
# 루리웹 수집기용 의존성
pip install requests beautifulsoup4

# 구글 캘린더 및 하이브리드 태스크용 의존성
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2
```

### 2. 노션 연동을 위한 데이터베이스 구축 (NEW)
하이브리드 태스크 모드를 노션과 함께 온전하게 사용하기 위해, 기존 `Issues` 데이터베이스 외에 `Projects` 및 `Milestones` 데이터베이스를 연동하고 관계형 프로퍼티를 구성해야 합니다. 이를 한 번에 수행하는 자동화 스크립트를 제공합니다.

1. [.env](file:///C:/Users/admin/antigravity-workflow/.env) 파일에 `NOTION_API_KEY`와 `NOTION_DATABASE_ID` (기존 `Issues` 데이터베이스 ID)를 입력합니다.
2. 아래 명령어를 실행하여 데이터베이스와 관계형 프로퍼티를 노션에 자동으로 생성합니다:
   ```powershell
   python execution/create_notion_dbs.py
   ```
3. 생성 완료 후 터미널에 출력되는 `NOTION_PROJECT_DB_ID` 및 `NOTION_MILESTONE_DB_ID` 값을 복사하여 [.env](file:///C:/Users/admin/antigravity-workflow/.env) 파일에 입력합니다.

### 3. 환경 변수 구성 ([.env](file:///C:/Users/admin/antigravity-workflow/.env))
프로젝트 루트 폴더의 [.env](file:///C:/Users/admin/antigravity-workflow/.env) 파일 설정을 확인하고 필요 사항을 구성합니다:

```env
# ==========================================
# 1. 루리웹 RSS 수집기 설정
# ==========================================
RSS_KEYWORDS=후방,후방주의,ㅎㅂ
RSS_INTERVAL=300
RSS_DURATION=24
RSS_OUTPUT_PATH=collected_posts.csv
RSS_ANALYSIS_DIR=ruli-analysis
RSS_LIKE_THRESHOLD=5

# ==========================================
# 2. Google Calendar 리마인더 설정
# ==========================================
CALENDAR_ID=primary
REMINDER_LEAD_TIME=60
CALENDAR_REPORT_DIR=calendar-reports

# ==========================================
# 3. 📅 Notion 및 하이브리드 태스크 관리 설정
# ==========================================
# 저장소 작동 모드 (hybrid: SQLite + Notion 양방향 동기화 / sqlite: 로컬 전용)
TASK_STORAGE_MODE=hybrid
# SQLite 로컬 DB 경로 (절대 경로 지정 권장)
SQLITE_DB_PATH=c:/Users/admin/antigravity-workflow/.tmp/task_board.db

# (hybrid 모드 사용 시 필수 설정)
NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=yyyyyyyyyyyyyyyyyyyy (기존 Issues 데이터베이스 ID)
NOTION_PROJECT_DB_ID=zzzzzzzzzzzzzzzzzzzz (create_notion_dbs.py 실행으로 생성된 ID)
NOTION_MILESTONE_DB_ID=wwwwwwwwwwwwwwwwwwww (create_notion_dbs.py 실행으로 생성된 ID)
```

---

## 🚀 실행 가이드

### 1. 하이브리드 태스크(업무) 등록 및 일정 동기화

로컬 SQLite, Notion, 그리고 구글 캘린더를 연동하여 업무를 관리합니다. 

#### 최초 데이터베이스 초기화
로컬 SQLite DB 파일 생성 및 기초 메타데이터(프로젝트, 상태, 우선순위, 사용자 정보 등)를 채워 넣기 위해 1회 실행합니다.
```powershell
python execution/initialize_db.py
```

#### 신규 태스크 등록 (CLI 사용법)
[task_cli.py](file:///C:/Users/admin/antigravity-workflow/execution/task_cli.py)를 사용하여 신규 태스크를 생성할 수 있습니다. 
```powershell
# 기본 생성 예시
python execution/task_cli.py --title "설계 회의 준비" --due "2026-06-20T10:00:00" --status "TODO" --priority "HIGH"
```
* **프로젝트, 마일스톤 및 라벨 지정 생성**:
  ```powershell
  python execution/task_cli.py --title "Arxml 완료보고서 검증" --due "2026-06-25T18:00:00" --project "DFT" --milestone "Milestone 1" --labels "ARXML,보고서"
  ```
  - `--milestone`으로 지정한 마일스톤이 해당 프로젝트 내에 없을 시, 자동으로 신규 생성하여 바인딩합니다.
  - `--labels`로 쉼표로 구분한 목록을 전달하면 태스크 분류를 위한 라벨 태그가 함께 저장됩니다.
* **대화형 승인 생략 플래그**:
  `--yes` 플래그를 사용하면 유사 업무 확인 등의 대화형 선택 프롬프트를 생략하고 즉시 등록합니다.
  ```powershell
  python execution/task_cli.py --title "설계 회의 준비" --due "2026-06-20T10:00:00" --yes
  ```

#### 📅 구글 캘린더 연동 상세 규칙
* **캘린더 지정 및 자동 매핑**: 구글 캘린더 연동 시 기본(`primary`) 캘린더가 아닌 **"직장" 캘린더**에 일정을 등록하여 관리합니다. (구글 계정에 "직장" 캘린더가 없으면 시스템이 자동으로 생성합니다)
* **등록 필터링 조건**: 업무의 제목(Title) 또는 설명(Description)에 **"보고", "전달", "미팅"** 단어가 포함된 경우에만 Google Calendar에 일정을 자동 등록합니다. (예: `코드 리팩토링`과 같은 일반 업무는 캘린더 일정을 생성하지 않음)
* **설명 템플릿 연동**: 캘린더 일정의 설명 본문에 프로젝트명, 마일스톤, 우선순위, 진척 상태, 세부 설명이 일목요연하게 구조화된 템플릿 형태로 기록됩니다.
* **완료 연동 규칙**: 업무 상태가 **`DONE` (완료)**으로 변경되면 구글 캘린더 일정 제목 앞에 **`[완료]`** 접두사를 자동으로 붙여주고, 다시 진행 상태로 바뀌면 접두사를 제거합니다.

---

### 2. Google Calendar 세부 기능 가이드 (NEW)
기존 [google_calendar_crud.py](file:///C:/Users/admin/antigravity-workflow/execution/google_calendar_crud.py) 스크립트는 폐기되었으며, 기능별 세부 엔진으로 개별 분할되었습니다.

#### A. 일정 추가 (Create)
[google_calendar_create.py](file:///C:/Users/admin/antigravity-workflow/execution/google_calendar_create.py)
* **실행 명령어**:
  ```powershell
  python execution/google_calendar_create.py --calendar-id "직장" --summary "SW개발 주간 검토" --start "2026-06-19T14:00:00" --end "2026-06-19T15:00:00"
  ```
* **동작**: 날짜 전후 7일 내에 유사한 일정이 있는지를 검사하고, 발견 시 수정(Update)/새로 생성(Create)/취소(Abort)를 선택할 수 있게 합니다. 비대화형 자동화를 원하는 경우 `--yes` 플래그와 함께 `--duplicate-mode`를 지정합니다.

#### B. 일정 수정 및 완료 상태 관리 (Update)
[google_calendar_update.py](file:///C:/Users/admin/antigravity-workflow/execution/google_calendar_update.py)
* **실행 명령어**:
  ```powershell
  python execution/google_calendar_update.py --calendar-id "직장" --event-id "일정고유ID" --summary "변경된 제목" --start "2026-06-19T15:00:00"
  ```
* **일정 완료 처리**: `--complete` 플래그를 전달하면 일정 제목 앞에 `[완료]` 태그가 추가됩니다.
  ```powershell
  python execution/google_calendar_update.py --calendar-id "직장" --event-id "일정고유ID" --complete
  ```

#### C. 일정 삭제 및 로컬 백업 (Delete)
[google_calendar_delete.py](file:///C:/Users/admin/antigravity-workflow/execution/google_calendar_delete.py)
* **실행 명령어**:
  ```powershell
  python execution/google_calendar_delete.py --calendar-id "직장" --event-id "일정고유ID"
  ```
* **동작**: 구글 캘린더에서 해당 일정을 삭제하기 전, 원본 메타데이터 전체를 로컬 백업 폴더(`calendar-archive/deleted_archive.json`)에 안전하게 기록(Archiving)합니다.

#### D. 삭제 일정 복원 (Restore)
[google_calendar_restore.py](file:///C:/Users/admin/antigravity-workflow/execution/google_calendar_restore.py)
* **실행 명령어**:
  ```powershell
  python execution/google_calendar_restore.py --event-id "과거삭제된일정ID"
  ```
* **동작**: 로컬의 `calendar-archive/deleted_archive.json` 파일에서 해당 ID의 백업 이력을 찾아, 구글 캘린더에 원본 데이터 그대로 다시 복원하고 복원 관련 메타데이터를 백업 아카이브에 업데이트합니다.

---

### 3. 루리웹 RSS 수집기 실행
* **쉘 스크립트 사용**: `./run_ruliweb_collector.sh`
* **Windows PowerShell (백그라운드 실행)**:
  ```powershell
  Start-Process python -ArgumentList "execution/collect_ruliweb_rss.py" -WindowStyle Hidden
  ```
* **일반 실행**: [collect_ruliweb_rss.py](file:///C:/Users/admin/antigravity-workflow/execution/collect_ruliweb_rss.py)

---

### 4. Google 캘린더 리마인더 실행
구글 캘린더와 연동하여 다가오는 시간대의 주요 미팅이나 일정을 체크하고 알림 리포트를 작성합니다. 최초 실행 시 브라우저 인증을 거쳐 `token.json`이 생성됩니다.
```powershell
python execution/google_calendar_reminder.py
```

---

## 📊 결과물 확인
* **태스크 및 칸반 보드**: 로컬 DB (`.tmp/task_board.db`) 및 노션 칸반 보드 페이지에서 조회할 수 있습니다.
* **루리웹 수집 글**: `collected_posts.csv` 및 `ruli-analysis/` 리포트 폴더에서 CSV 파일 확인 가능.
* **캘린더 일정/리마인드**: 구글 캘린더 및 `calendar-reports/` 리포트 폴더에서 리포트 문서 확인 가능.
* **삭제 일정 백업본**: `calendar-archive/deleted_archive.json` 로컬 파일
