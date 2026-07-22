# -*- coding: utf-8-sig -*-
"""
Google 캘린더 삭제 일정 복원 실행 엔진
(Layer 3: Execution - Restore)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import datetime
import json
import argparse
from googleapiclient.errors import HttpError

# 공통 모듈 임포트
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calendar_common import get_calendar_service, handle_api_error

def main():
    parser = argparse.ArgumentParser(description="Google Calendar 삭제 일정 복원 툴")
    parser.add_argument("--event-id", type=str, required=True,
                        help="복원할 삭제된 일정 ID")
    parser.add_argument("--archive-dir", type=str, default="calendar-archive",
                        help="로컬 백업 아카이브 디렉터리 경로 (기본값: calendar-archive)")
    
    args = parser.parse_args()
    
    try:
        archive_path = os.path.join(args.archive_dir, "deleted_archive.json")
        
        if not os.path.exists(archive_path):
            print(f"[오류] 아카이브 파일이 존재하지 않습니다. (경로: {archive_path})", file=sys.stderr)
            sys.exit(1)
            
        # 1. 아카이브 로드
        try:
            with open(archive_path, "r", encoding="utf-8-sig") as f:
                archive_data = json.load(f)
        except Exception as e:
            print(f"[오류] 아카이브 파일을 읽는 도중 에러가 발생했습니다: {e}", file=sys.stderr)
            sys.exit(1)
            
        # 2. 일치하는 삭제 이력 찾기
        target_record = None
        for record in archive_data:
            if record.get("event_id") == args.event_id and record.get("status") == "deleted":
                target_record = record
                break
                
        if not target_record:
            print(f"[오류] 아카이브에서 복원 가능한 상태의 일정 ID '{args.event_id}' 삭제 로그를 찾을 수 없습니다.", file=sys.stderr)
            print(" 이미 복원되었거나, 삭제 이력이 존재하지 않을 수 있습니다.", file=sys.stderr)
            sys.exit(1)
            
        # 3. 구글 캘린더 복원용 데이터 필터링 (시스템 필드 제거)
        original_data = target_record["event_data"]
        calendar_id = target_record["calendar_id"]
        
        # 시스템 읽기 전용 속성들을 필터링하여 삽입 오류 방지
        restore_body = {
            "summary": original_data.get("summary"),
            "description": original_data.get("description"),
            "start": original_data.get("start"),
            "end": original_data.get("end"),
            "location": original_data.get("location"),
            "colorId": original_data.get("colorId"),
            "recurrence": original_data.get("recurrence"),
            "reminders": original_data.get("reminders"),
        }
        
        service = get_calendar_service()
        
        print(f" -> 캘린더 '{calendar_id}'에 일정 '{restore_body['summary']}' 복원을 시작합니다...")
        restored_event = service.events().insert(calendarId=calendar_id, body=restore_body).execute()
        
        # 4. 아카이브 상태 업데이트 및 저장
        target_record["status"] = "restored"
        target_record["restored_at"] = datetime.datetime.now().astimezone().isoformat()
        target_record["new_event_id"] = restored_event.get("id")
        
        with open(archive_path, "w", encoding="utf-8-sig") as f:
            json.dump(archive_data, f, ensure_ascii=False, indent=2)
            
        print("\n✅ 삭제된 일정이 성공적으로 복원되었습니다!")
        print(f" - 복원 일정: {restored_event.get('summary', '(제목 없음)')}")
        print(f" - 새 일정 ID: {restored_event.get('id')}")
        print(f" - 링크: {restored_event.get('htmlLink')}")
        print(f" - 아카이브 백업 상태가 'restored'로 갱신되었습니다.")
        
    except HttpError as error:
        handle_api_error(error)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 예기치 못한 오류 발생: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
