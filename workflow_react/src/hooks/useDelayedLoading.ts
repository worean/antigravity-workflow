// -*- coding: utf-8 -*-
import { useState, useEffect, useRef } from 'react';

export interface UseDelayedLoadingOptions {
  delayMs?: number;       // 스피너 노출 지연 시간 (기본: 1000ms = 1초)
  minDisplayMs?: number;  // 스피너가 떴을 때 최소 유지 시간 (기본: 400ms)
}

/**
 * ⏳ 로딩 깜빡임(Flickering) 방지 훅
 * - 1초(1000ms) 이내에 응답이 도착하면 스피너를 아예 띄우지 않음.
 * - 1초 이상 요청이 지연될 때만 스피너를 부드럽게 표시.
 */
export function useDelayedLoading(
  loading: boolean,
  options: UseDelayedLoadingOptions = {}
): boolean {
  const { delayMs = 1000, minDisplayMs = 400 } = options;
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const showStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      // 로딩 시작 시 1초(delayMs) 후 노출 타이머 세팅
      timerRef.current = setTimeout(() => {
        setShouldShow(true);
        showStartTimeRef.current = Date.now();
      }, delayMs);
    } else {
      // 로딩 종료 시
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (showStartTimeRef.current !== null) {
        // 이미 스피너가 화면에 떴다면 최소 표시 시간(minDisplayMs)을 보장 후 해제
        const elapsedTime = Date.now() - showStartTimeRef.current;
        const remainingTime = Math.max(0, minDisplayMs - elapsedTime);

        if (remainingTime > 0) {
          const hideTimer = setTimeout(() => {
            setShouldShow(false);
            showStartTimeRef.current = null;
          }, remainingTime);
          return () => clearTimeout(hideTimer);
        } else {
          setShouldShow(false);
          showStartTimeRef.current = null;
        }
      } else {
        // 1초 이내에 빠르게 완료됨 -> 스피너 노출 취소 (스피너가 아예 안 뜸)
        setShouldShow(false);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [loading, delayMs, minDisplayMs]);

  return shouldShow;
}
