# -*- coding: utf-8-sig -*-
"""
Google 캘린더 일정 삭제 및 로컬 아카이빙 실행 엔진
(Layer 3: Execution - Delete)
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
from calendar_common import get_calendar_service, handle_api_error, load_calendar_config

def resolve_calendar_id(calendar_id_input, service):
    """입력된 캘린더 ID를 실제 구글 캘린더 ID로 해결합니다."""
    if not calendar_id_input:
        return "primary"
    if calendar_id_input.lower() == "primary":
        return "primary"
        
    calendars = load_calendar_config(service)
    for cal in calendars:
        if cal.get("summary") == calendar_id_input or cal.get("id") == calendar_id_input:
            return cal.get("id")
            
    return calendar_id_input

def main():
    parser = argparse.ArgumentParser(description="Google Calendar 일정 삭제 및 백업 툴")
    parser.add_argument("--calendar-id", type=str, default="primary",
                        help="대상 캘린더 ID 또는 이름 (기본값: primary)")
    parser.add_argument("--event-id", type=str, required=True,
                        help="삭제할 일정 ID")
    parser.add_argument("--archive-dir", type=str, default="calendar-archive",
                        help="로컬 백업 아카이브 디렉터리 경로 (기본값: calendar-archive)")
    
    args = parser.parse_args()
    
    try:
        service = get_calendar_service()
        calendar_id = resolve_calendar_id(args.calendar_id, service)
        
        # 1. 삭제할 일정 상세 정보 가져오기 (백업용)
        print(f" -> 캘린더 '{calendar_id}'에서 삭제할 일정 '{args.event_id}' 정보를 백업하기 위해 조회합니다...")
        try:
            event = service.events().get(calendarId=calendar_id, eventId=args.event_id).execute()
        except HttpError as err:
            if err.resp.status == 404:
                print(f"[오류] 일정 ID '{args.event_id}'를 찾을 수 없거나 이미 삭제되었습니다.", file=sys.stderr)
                sys.exit(1)
            raise err
            
        # 2. 로컬 아카이브에 백업 기록 저장
        os.makedirs(args.archive_dir, exist_ok=True)
        archive_path = os.path.join(args.archive_dir, "deleted_archive.json")
        
        archive_data = []
        if os.path.exists(archive_path):
            try:
                with open(archive_path, "r", encoding="utf-8-sig") as f:
                    archive_data = json.load(f)
            except Exception as e:
                print(f"[경고] 기존 아카이브 파일 로드 오류: {e}. 백업 파일을 새로 구성합니다.", file=sys.stderr)
                
        # 새 삭제 기록 추가
        now_str = datetime.datetime.now().astimezone().isoformat()
        backup_record = {
            "deleted_at": now_str,
            "calendar_id": calendar_id,
            "event_id": args.event_id,
            "status": "deleted",
            "event_data": event
        }
        archive_data.append(backup_record)
        
        # 저장 (UTF-8 with BOM)
        with open(archive_path, "w", encoding="utf-8-sig") as f:
            json.dump(archive_data, f, ensure_ascii=False, indent=2)
            
        print(f" -> 삭제 대상 일정이 로컬 아카이브에 안전하게 백업되었습니다. (경로: {archive_path})")
        
        # 3. 구글 캘린더에서 실제 삭제
        print(f" -> 구글 캘린더 서버에서 일정을 제거합니다...")
        service.events().delete(calendarId=calendar_id, eventId=args.event_id).execute()
        
        print(f"\n✅ 일정 삭제가 완료되었습니다!")
        print(f" - 삭제 일정: {event.get('summary', '(제목 없음)')}")
        print(f" - 일정 ID: {args.event_id}")
        
    except HttpError as error:
        handle_api_error(error)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 예기치 못한 오류 발생: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
