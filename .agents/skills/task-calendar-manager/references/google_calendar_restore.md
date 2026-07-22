# Google 캘린더 삭제 일정 복원 지침서 (SOP)

이 지침서는 로컬 아카이브 백업(`deleted_archive.json`) 데이터를 기반으로 구글 캘린더에서 삭제된 일정을 복구하는 워크플로우를 다룹니다.

## 1. 개요 및 목적
* 실수 또는 시스템 오류로 인해 삭제되었던 일정을 원본 일정 ID(Event ID)를 조회하여 원래 생성되어 있던 캘린더에 똑같이 복구해 냅니다.

## 2. 매개변수 규격
* 스크립트 경로: `execution/google_calendar_restore.py`
* 입력 인수:
  * `--event-id` (필수): 복원할 삭제된 일정의 기존 고유 ID.
  * `--archive-dir`: 로컬 아카이브 데이터가 저장된 디렉터리 경로 (기본값: `calendar-archive`).

## 3. 실행 예시
* **삭제된 일정 복원**:
  ```powershell
  python execution/google_calendar_restore.py --event-id "exampleEventID12345"
  ```
* **결과**:
  * 구글 캘린더 내 원래 캘린더로 해당 일정이 재등록됩니다.
  * `calendar-archive/deleted_archive.json` 파일의 해당 일정 기록 중 `"status"`가 `"restored"`로 업데이트되며 복원 정보(`restored_at`, `new_event_id`)가 추가됩니다.

## 4. 예외 사항 및 주의
* 아카이브에 기재된 일정이 이미 복원되었거나(`"status": "restored"` 상태) 아카이브에 이력이 없으면 에러 로그를 노출하고 안전하게 종료됩니다.
* 복원 시 구글 캘린더 내부 정책에 따라 신규 일정 ID가 발급되며, 복원된 일정의 원본 메타데이터는 로컬 보관용 아카이브 내역에 그대로 유지되어 이력 관리에 용이합니다.
