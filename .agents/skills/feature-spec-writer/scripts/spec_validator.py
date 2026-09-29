# -*- coding: utf-8 -*-
"""
AntiGravity Feature Specification Validator (spec_validator.py)
기획 사양서(docs/features/*.md)가 FEATURE_SPEC_TEMPLATE.md의 표준 규격과
필수 데이터 항목(DB 모델, API 명세, 400줄 UI 서브 컴포넌트, Mock Data, QA TC)을
충실히 충족하는지 정적으로 검증하는 CLI 도구입니다.
"""

import os
import sys
import re
import argparse

# Windows 콘솔 UTF-8 출력 보정
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

REQUIRED_SECTIONS = [
    (r"##\s+1\.\s+기능\s*개요", "1. 기능 개요 및 사용자 가치"),
    (r"##\s+2\.\s+데이터\s*모델", "2. 데이터 모델 및 비즈니스 규칙"),
    (r"##\s+3\.\s+백엔드\s*(?:REST\s*)?API\s*명세", "3. 백엔드 REST API 명세"),
    (r"##\s+4\.\s+프론트엔드\s*UI/UX\s*사양", "4. 프론트엔드 UI/UX 사양"),
    (r"##\s+5\.\s+QA\s*및\s*통합\s*테스트", "5. QA 및 통합 테스트 시나리오"),
    (r"##\s+6\.\s+개발\s*파이프라인\s*산출물", "6. 개발 파이프라인 산출물 체크리스트")
]

REQUIRED_SUB_ITEMS = [
    ("Prisma 스키마 모델 코드 블록 (```prisma)", r"```prisma[\s\S]*?```"),
    ("REST API 엔드포인트 테이블", r"\|[\s\S]*?(?:GET|POST|PUT|DELETE)[\s\S]*?\|"),
    ("API JSON 응답 샘플 (```json)", r"```json[\s\S]*?```"),
    ("서브 컴포넌트 분할 계획", r"src/components/(?:\[[\w\-_]+\]|[\w\-_]+)/"),
    ("프론트엔드 Mock Data 코드 블록", r"MOCK_[\w\-_]+|export\s+const\s+mock"),
    ("Positive QA 테스트 케이스 (TC-POS)", r"TC-POS-\d+"),
    ("Negative QA 테스트 케이스 (TC-NEG)", r"TC-NEG-\d+")
]

PLACEHOLDER_PATTERNS = [
    (r"\[기능명\]", "기능명 미지정 ([기능명])"),
    (r"\[도메인\]", "도메인 미지정 ([도메인])"),
    (r"\*이 기능이 왜 필요한지[^\*]*\*", "배경 미작성 가이드 텍스트 잔존"),
    (r"\*본 기능을 통해 달성하고자 하는[^\*]*\*", "목적 미작성 가이드 텍스트 잔존"),
    (r"ExampleEntity", "DB 모델 기본 예시(ExampleEntity) 잔존"),
    (r"Mock 데이터 1", "Mock 데이터 기본 예시 잔존")
]

def validate_spec_file(file_path):
    if not os.path.exists(file_path):
        print(f"[ERROR] 지정된 기획서 파일을 찾을 수 없습니다: {file_path}")
        return False

    with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
        content = f.read()

    errors = []
    warnings = []

    # 1. 필수 섹션 존재 검사
    for pattern, name in REQUIRED_SECTIONS:
        if not re.search(pattern, content):
            errors.append(f"필수 섹션 누락: '{name}' 섹션이 문서에 존재하지 않습니다.")

    # 2. 필수 세부 항목 검사
    for name, pattern in REQUIRED_SUB_ITEMS:
        if not re.search(pattern, content, re.IGNORECASE):
            errors.append(f"필수 기술 데이터 누락: {name}")

    # 3. 미완료 플레이스홀더 검사
    for pattern, msg in PLACEHOLDER_PATTERNS:
        if re.search(pattern, content):
            warnings.append(f"미완성 템플릿 플레이스홀더 발견: {msg}")

    # 4. 파일명 네이밍 검사 (docs/features/XX_..._SPECIFICATION.md 권장)
    base_name = os.path.basename(file_path)
    if not re.match(r"^\d{2}_.+_SPECIFICATION\.md$", base_name, re.IGNORECASE) and base_name != "FEATURE_SPEC_TEMPLATE.md":
        warnings.append(f"파일명 권장 형식 미준수: '{base_name}' (권장: docs/features/06_[FEATURE_NAME]_SPECIFICATION.md)")

    print(f"\n==================================================")
    print(f"📋 [Spec Validator] 기획 사양서 정적 검증: {base_name}")
    print(f"   경로: {file_path}")
    print(f"==================================================")

    if errors:
        print(f"\n❌ [ERRORS] 총 {len(errors)}건의 필수 규격 누락:")
        for idx, err in enumerate(errors, 1):
            print(f"   {idx}. {err}")

    if warnings:
        print(f"\n⚠️ [WARNINGS] 총 {len(warnings)}건의 권장/미완성 항목:")
        for idx, warn in enumerate(warnings, 1):
            print(f"   {idx}. {warn}")

    if not errors and not warnings:
        print("\n✨ [PERFECT] 모든 필수 섹션, DB 스키마, API 규격, UI 컴포넌트 분할, Mock Data, QA TC가 완벽히 작성되었습니다!")
        return True
    elif not errors:
        print("\n✅ [PASS] 필수 항목 검증을 통과했습니다. (일부 경고 권장사항 확인 필요)")
        return True
    else:
        print("\n🚫 [FAIL] 기획서에 필수 데이터가 누락되었습니다. 보완 후 다시 검증하세요.")
        return False

def main():
    parser = argparse.ArgumentParser(description="Feature Specification Validator CLI")
    parser.add_argument("spec_file", help="검증할 기획서 Markdown 파일 경로 (예: docs/features/03_GOOGLE_CALENDAR_SPECIFICATION.md)")
    args = parser.parse_args()

    success = validate_spec_file(args.spec_file)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
