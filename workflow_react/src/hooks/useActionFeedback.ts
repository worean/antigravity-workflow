import { useState, useCallback } from 'react';

export interface ErrorModalState {
  isOpen: boolean;
  message?: string;
  errorCode?: string;
  statusCode?: number;
}

export const useActionFeedback = () => {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<ErrorModalState>({ isOpen: false });

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
        // API 수신받기 전까지 Spinner 표시 대기
        const result = await asyncFn();

        setIsPending(false);

        // API 응답 수신 즉시 수신된 최신 데이터(data)를 UI state에 반영
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
    errorState,
    closeErrorModal,
    executeAction,
  };
};
