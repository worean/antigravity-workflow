# -*- coding: utf-8-sig -*-
"""
Google 캘린더 자동화 공통 유틸리티 및 인증 모듈
(Layer 3: Execution - Common)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import datetime
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# UTF-8 출력 강제 설정 (윈도우 콘솔 한글 깨짐 방지)
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# 쓰기 및 관리가 포함된 구글 캘린더 전체 권한 범위
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    """구글 Calendar API 인증을 완료하고 서비스 객체를 반환합니다."""
    creds = None
    # 이전에 발급받은 토큰이 있으면 로드
    if os.path.exists('token.json'):
        try:
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        except Exception as e:
            print(f"[{datetime.datetime.now()}] 기존 token.json 파일 로드 중 오류 발생: {e}. 재인증을 시도합니다.", file=sys.stderr)

    # 유효한 자격 증명이 없으면 사용자 로그인 유도
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"[{datetime.datetime.now()}] 토큰 갱신 중 오류 발생: {e}. 새로운 인증 흐름을 시작합니다.", file=sys.stderr)
                creds = None

        if not creds:
            if not os.path.exists('credentials.json'):
                print("\n" + "="*80, file=sys.stderr)
                print(" [오류] 'credentials.json' 파일을 찾을 수 없습니다.", file=sys.stderr)
                print(" Google Cloud Console에서 OAuth 클라이언트 ID(데스크톱 앱)를 생성하고", file=sys.stderr)
                print(" 다운로드한 파일을 프로젝트 루트 디렉터리에 'credentials.json'으로 복사해 주세요.", file=sys.stderr)
                print("="*80 + "\n", file=sys.stderr)
                sys.exit(1)
            
            try:
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
                # 다음 인증을 위해 토큰 저장
                with open('token.json', 'w', encoding='utf-8') as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"[{datetime.datetime.now()}] 구글 인증 흐름 진행 중 오류 발생: {e}", file=sys.stderr)
                sys.exit(1)
                
    return build('calendar', 'v3', credentials=creds)

def load_calendar_config(service):
    """
    calendar_config.json 파일에서 모니터링할 캘린더 설정을 로드합니다.
    파일이 없으면 구글 Calendar List API를 조회하여 새로 생성합니다.
    """
    config_path = 'calendar_config.json'
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8-sig') as f:
                config_data = json.load(f)
            configs = config_data.get("managed_calendars", [])
            if configs:
                enabled = [c for c in configs if c.get("enabled", True)]
                if enabled:
                    return enabled
                else:
                    print(f"[{datetime.datetime.now()}] 경고: calendar_config.json에 활성화(enabled=true)된 캘린더가 없습니다.", file=sys.stderr)
        except Exception as e:
            print(f"[{datetime.datetime.now()}] calendar_config.json 로드 중 오류 발생: {e}. 구글 API로부터 목록을 갱신합니다.", file=sys.stderr)
            
    try:
        print(f"[{datetime.datetime.now()}] 구글 계정에서 캘린더 목록을 조회하여 새로운 '{config_path}' 파일을 생성합니다...")
        calendar_list_result = service.calendarList().list().execute()
        calendar_items = calendar_list_result.get('items', [])
        
        configs = []
        for item in calendar_items:
            summary = item.get('summaryOverride') or item.get('summary') or item.get('id')
            configs.append({
                "id": item.get('id'),
                "summary": summary,
                "description": item.get('description', ''),
                "enabled": True
            })
            
        config_data = {
            "managed_calendars": configs
        }
        
        with open(config_path, 'w', encoding='utf-8-sig') as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)
            
        print(f"[{datetime.datetime.now()}] '{config_path}' 파일이 생성되었습니다. 감시를 원치 않는 캘린더는 'enabled': false 로 설정해 주세요.")
        return [c for c in configs if c["enabled"]]
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 캘린더 목록을 구글 API로부터 조회하는 중 오류 발생: {e}", file=sys.stderr)
        return [{"id": "primary", "summary": "기본 캘린더", "enabled": True}]

def parse_input_time(time_str):
    """사용자 입력 시간 문자열을 ISO 8601 형식(timezone-aware)으로 변환합니다.
    입력 형식이 YYYY-MM-DD HH:MM:SS 또는 ISO 형식이면 로컬 타임존을 부여합니다.
    """
    if not time_str:
        return None
    try:
        # T 구분자가 없고 공백만 있을 경우 변환
        if " " in time_str and "T" not in time_str:
            time_str = time_str.replace(" ", "T")
        
        dt = datetime.datetime.fromisoformat(time_str)
        if dt.tzinfo is None:
            # 로컬 타임존 적용
            dt = dt.astimezone()
        return dt.isoformat()
    except ValueError:
        print(f"[오류] 시간 포맷 에러: '{time_str}'은 올바른 날짜/시간 형식이 아닙니다. (예: YYYY-MM-DDTHH:MM:SS)", file=sys.stderr)
        sys.exit(1)

def parse_event_time(time_dict):
    """구글 캘린더 API의 시간 딕셔너리를 시스템 타임존이 반영된 tz-aware datetime 객체로 파싱합니다."""
    if 'dateTime' in time_dict:
        return datetime.datetime.fromisoformat(time_dict['dateTime'])
    elif 'date' in time_dict:
        date_str = time_dict['date']
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return dt.astimezone()
    return None

def format_timedelta(td):
    """timedelta 객체를 가독성 좋은 'H시간 M분' 형태로 포맷팅합니다."""
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    if hours > 0:
        return f"{hours}시간 {minutes}분"
    return f"{minutes}분"

def handle_api_error(error):
    """구글 API 예외 처리 및 가이드 메시지 출력"""
    if hasattr(error, 'resp') and error.resp.status == 403:
        print("\n" + "!"*80, file=sys.stderr)
        print(" [권한 오류] 구글 캘린더 쓰기/수정 권한이 부족합니다 (403 Forbidden).", file=sys.stderr)
        print(" 기존에 발급받은 'token.json'의 권한 범위가 읽기 전용(readonly)으로 생성되었을 확률이 높습니다.", file=sys.stderr)
        print(" 해결 방법: 프로젝트 루트 폴더의 'token.json' 파일을 지우고 스크립트를 다시 실행하여", file=sys.stderr)
        print(" 쓰기 권한이 포함된 새 로그인 토큰을 발급받아 주십시오.", file=sys.stderr)
        print("!"*80 + "\n", file=sys.stderr)
    else:
        print(f"[{datetime.datetime.now()}] Google Calendar API 호출 중 오류 발생: {error}", file=sys.stderr)
