#!/bin/bash
# UTF-8 with BOM
# 루리웹 RSS 수집기를 실행하는 쉘 스크립트입니다.

echo "=================================================="
echo " Starting Ruliweb RSS Collector..."
echo "=================================================="

# 파이썬 스크립트 실행
python execution/collect_ruliweb_rss.py
