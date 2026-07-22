---
name: task-calendar-manager
description: SQLite DB, Notion 및 Google Calendar를 연동하여 프로젝트와 태스크를 관리하는 하이브리드 작업 관리 시스템 스킬입니다.
---

# 📅 하이브리드 작업 및 일정 관리 시스템 가이드

본 스킬은 로컬 SQLite 데이터베이스, Notion 칸반보드 및 Google Calendar("직장" 캘린더)를 연동하여 프로젝트, 마일스톤, 태스크(이슈)를 통합 관리하기 위한 운영 지침과 실행 도구 규칙을 제공합니다.

---

## 1. 시스템 아키텍처 및 설정
* **로컬 DB 경로**: `C:/Users/admin/antigravity-workflow/.tmp/task_board.db` (SQLite)
* **환경 변수 (.env)**: `TASK_STORAGE_MODE=sqlite` 또는 `hybrid`
* **Google 캘린더 연동**: 사용자의 **"직장"** 캘린더를 타겟으로 일정을 생성 및 관리합니다.

---

## 2. 윈도우 환경 실행 필수 규칙
Windows PowerShell/CMD 환경에서 한글 깨짐 및 인코딩 예외(CP949 충돌)를 방지하기 위해 파이썬 실행 시 반드시 `PYTHONUTF8=1` 설정을 포함해야 합니다.

* **실행 예시 (PowerShell)**:
  ```powershell
  $env:PYTHONUTF8=1; python execution/task_cli.py --title "회의" --due "2026-06-20T10:00:00"
  ```

---

## 3. 핵심 스크립트 실행 가이드

### A. 신규 프로젝트 추가 (DB 직접 연동)
현재 CLI에 프로젝트를 직접 추가하는 기능이 제공되지 않으므로, 아래 파이썬 코드를 작성하여 DB에 신규 프로젝트를 저장합니다.
```python
# PYTHONUTF8=1 환경에서 실행 필수
from task_repository import SQLiteRepository, HybridRepository
# repository 빌드 후 save_project 호출
project_payload = {
    "name": "프로젝트명",
    "key": "PROJ_KEY",
    "description": "상세설명",
    "ownerId": 1,
    "status": "TODO",
    "priority": "MEDIUM"
}
repo.save_project(project_payload)
```

### B. 신규 업무(태스크) 등록 (`task_cli.py`)
새로운 업무를 등록하면 조건에 따라 Google Calendar("직장")와 자동 연동됩니다.
```powershell
$env:PYTHONUTF8=1; python execution/task_cli.py --title "업무 제목" --due "YYYY-MM-DDTHH:MM:SS" --project "PROJ_KEY"
```
* **캘린더 자동 연동 규칙**: 업무 제목(Title) 이나 설명(Description)에 **"보고", "전달", "미팅"** 단어가 포함된 경우에만 Google Calendar("직장")에 일정을 자동으로 연동하여 1시간의 시간 블록을 생성합니다.
* **마일스톤 자동 바인딩**: `--milestone` 이름이 프로젝트 내에 존재하지 않는 경우 자동으로 신규 생성되어 바인딩됩니다.

### C. 일정 단독 관리 (`google_calendar_*.py`)
태스크 DB와 연동하지 않고 구글 캘린더의 일정을 단독으로 추가, 수정, 완료, 삭제할 때 사용합니다.
* **일정 추가**: `google_calendar_create.py`
* **일정 수정 및 완료 처리**: `google_calendar_update.py` (완료 시 제목 앞에 `[완료]` 자동 접두사 추가)
* **일정 삭제**: `google_calendar_delete.py`

### D. 일정 리마인드 및 오늘 일정 리포트 (`google_calendar_reminder.py`)
오늘 일정을 스캔하여 진행 대기(Scheduled), 진행 중(In Progress), 기한 초과(Overdue) 상태를 분석하고 마크다운 리포트를 자동 생성합니다.
```powershell
$env:PYTHONUTF8=1; python execution/google_calendar_reminder.py
```

---

## 4. 문제 해결 및 자가 치유(Self-annealing) 프로토콜
1. **중복 일정 감지 시**: 새로 추가하려는 일정의 날짜 전후 7일 내에 유사한 업무가 존재할 때, CLI는 사용자에게 업데이트(`update`), 새로 생성(`create`), 취소(`abort`) 여부를 질의합니다. 자동화 실행인 경우 `--yes`와 함께 `--duplicate-mode`를 명시합니다.
2. **Notion 동기화 실패 시**: `syncStatus`가 `ERROR`로 설정됩니다. `.env` 변수의 데이터베이스 ID 및 API 키 유효성을 검토한 뒤 배치 동기화를 통해 정합성을 맞춥니다.