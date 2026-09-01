import { useState, useCallback } from 'react';
import { useDelayedLoading } from './useDelayedLoading';

export interface ErrorModalState {
  isOpen: boolean;
  message?: string;
  errorCode?: string;
  statusCode?: number;
}

export const useActionFeedback = (delayMs: number = 1000) => {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<ErrorModalState>({ isOpen: false });

  // ⏳ 1초(1000ms) 이내에 완료되는 빠른 응답 시 스피너/상태 변경 깜빡임 방지용 지연 상태
  const isPendingDelayed = useDelayedLoading(isPending, { delayMs, minDisplayMs: 400 });

  const closeErrorModal = useCallback(() => {
    setErrorState({ isOpen: false });
  }, []);

  const executeAction = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
      }
    ): Promise<T | null> => {
      setIsPending(true);
      setErrorState({ isOpen: false });

      try {
        const result = await asyncFn();

        setIsPending(false);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }
        return result;
      } catch (err: any) {
        setIsPending(false);

        let errorCode = 'ERR_ACTION_FAILED';
        let message = '작업 처리 중 오류가 발생했습니다.';
        let statusCode = err.response?.status;

        if (err.response?.data) {
          errorCode = err.response.data.errorCode || errorCode;
          message = err.response.data.error || err.message || message;
        } else if (err.message) {
          message = err.message;
        }

        setErrorState({
          isOpen: true,
          errorCode,
          message,
          statusCode,
        });

        return null;
      }
    },
    []
  );

  return {
    isPending,
    isPendingDelayed,
    errorState,
    closeErrorModal,
    executeAction,
  };
};
