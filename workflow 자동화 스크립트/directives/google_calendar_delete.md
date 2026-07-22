# Google 캘린더 일정 삭제 및 아카이빙 지침서 (SOP)

이 지침서는 구글 캘린더 일정을 영구 삭제하기 전 로컬 아카이브 파일에 안전하게 데이터를 백업(Archive)하고 삭제하는 워크플로우를 다룹니다.

## 1. 개요 및 목적
* 실수로 인한 중요한 일정이 삭제되는 사고를 방지하기 위해 구글 캘린더에서 제거되기 직전 일정의 원본 메타데이터를 로컬 JSON 파일에 백업 보관합니다.
* 백업된 이력은 추후 복원 스크립트(`google_calendar_restore.py`)를 통해 원상 복구될 수 있습니다.

## 2. 매개변수 규격
* 스크립트 경로: `execution/google_calendar_delete.py`
* 입력 인수:
  * `--calendar-id`: 대상 캘린더 ID 또는 이름 (기본값: `primary`).
  * `--event-id` (필수): 삭제할 일정의 고유 ID.
  * `--archive-dir`: 로컬 아카이브 데이터가 저장될 디렉터리 경로 (기본값: `calendar-archive`).

## 3. 실행 예시
* **일정 백업 후 삭제**:
  ```powershell
  python execution/google_calendar_delete.py --calendar-id "직장" --event-id "exampleEventID12345"
  ```
* **결과**:
  * `calendar-archive/deleted_archive.json` 파일에 일정 정보가 기록됩니다.
  * 구글 캘린더에서 해당 일정이 삭제됩니다.

## 4. 백업 아카이브 형식
백업 파일은 `calendar-archive/deleted_archive.json` 경로에 UTF-8 with BOM 인코딩 형식으로 저장됩니다.
```json
[
  {
    "deleted_at": "2026-06-17T13:30:00.123456+09:00",
    "calendar_id": "fcf152e8b3f42173b2d932487f8e1c45e5b7e412e140d0a83564e532bacbd9b3@group.calendar.google.com",
    "event_id": "exampleEventID12345",
    "status": "deleted",
    "event_data": {
      "summary": "SW개발파트 회의",
      "description": "일정 내용",
      "start": { "dateTime": "2026-06-19T15:00:00+09:00" },
      "end": { "dateTime": "2026-06-19T16:00:00+09:00" }
      // ...기타 구글 API 반환 원본 필드
    }
  }
]
```
