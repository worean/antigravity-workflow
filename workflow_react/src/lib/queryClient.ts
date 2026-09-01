import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2분 동안 데이터 신선하게 유지 (Fresh)
      gcTime: 1000 * 60 * 10,   // 10분 동안 메모리 캐시 유지 (Garbage Collection)
      refetchOnWindowFocus: false, // 창 전환 시 불필요한 자동 재요청 방지
      retry: 1,                 // 네트워크 장애 시 1회 재시도
      placeholderData: (previousData: unknown) => previousData, // 🌟 탭 전환 및 쿼리 리프레시 시 기존 데이터를 화면에 부드럽게 유지 (No Flash)
    },
    mutations: {
      retry: 0,
    },
  },
});
