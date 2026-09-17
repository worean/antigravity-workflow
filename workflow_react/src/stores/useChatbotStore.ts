import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatbotModel, ChatbotMessage, ChatbotAction } from '@/types/chatbot';
import { requestChatbotResponse, executeChatbotAction } from '@/api/chatbot';

export interface ChatbotStoreState {
  // 팝업 열림/최소화 상태
  isOpen: boolean;
  isMinimized: boolean;

  // AI 모델 설정 및 상태
  selectedModel: ChatbotModel;
  autoExecute: boolean; // Auto Mode: AI 제안 액션 자동 실행 여부
  isThinking: boolean;
  messages: ChatbotMessage[];

  // 제어 액션
  openChatbot: () => void;
  closeChatbot: () => void;
  toggleChatbot: () => void;
  toggleMinimize: () => void;
  setModel: (model: ChatbotModel) => void;
  toggleAutoExecute: () => void;
  setAutoExecute: (enabled: boolean) => void;

  // 대화 및 액션 실행
  sendMessage: (prompt: string) => Promise<void>;
  executeAction: (actionId: string, isAuto?: boolean) => Promise<void>;
  executeAllActions: (actionIds: string[]) => Promise<void>;
  clearMessages: () => void;
}

const INITIAL_MESSAGES: ChatbotMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    content: `👋 안녕하세요! **AntiGravity AI 워크플로우 어시스턴트**입니다.\n\n업무 진행 중 궁금한 사항을 묻거나, **"새 이슈 등록해줘"**, **"내 일감 요약해줘"**, 또는 **"이슈 #3 완료하고 새 버그 이슈 등록해줘"** 같은 복합 명령으로 시스템을 동시에 제어해 보세요!`,
    timestamp: Date.now(),
  },
];

export const useChatbotStore = create<ChatbotStoreState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      selectedModel: 'gpt-4o-mini',
      autoExecute: false, // 기본값: 수동 승인 모드 (Auto Mode 토글로 즉시 실행 전환 가능)
      isThinking: false,
      messages: INITIAL_MESSAGES,

      openChatbot: () => set({ isOpen: true, isMinimized: false }),
      closeChatbot: () => set({ isOpen: false }),
      toggleChatbot: () => set((state) => ({ isOpen: !state.isOpen, isMinimized: false })),
      toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
      setModel: (selectedModel) => set({ selectedModel }),
      toggleAutoExecute: () => set((state) => ({ autoExecute: !state.autoExecute })),
      setAutoExecute: (autoExecute) => set({ autoExecute }),

      sendMessage: async (prompt: string) => {
        const trimmed = prompt.trim();
        if (!trimmed || get().isThinking) return;

        const userMsg: ChatbotMessage = {
          id: `msg-user-${Date.now()}`,
          role: 'user',
          content: trimmed,
          timestamp: Date.now(),
        };

        const currentMessages = get().messages;
        set({
          messages: [...currentMessages, userMsg],
          isThinking: true,
        });

        try {
          const model = get().selectedModel;
          const aiResponse = await requestChatbotResponse(trimmed, model, [...currentMessages, userMsg]);

          const assistantMsg: ChatbotMessage = {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: aiResponse.text,
            actions: aiResponse.actions,
            steps: aiResponse.steps,
            usage: aiResponse.usage,
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, assistantMsg],
            isThinking: false,
          }));

          // ⚡ Auto Mode가 켜져 있고 대기 중인 액션이 있다면 즉시 자동 일괄 병렬 실행!
          if (get().autoExecute && assistantMsg.actions && assistantMsg.actions.length > 0) {
            await get().executeAllActions(assistantMsg.actions.map((act) => act.id));
          }
        } catch (err: any) {
          const errorMsg: ChatbotMessage = {
            id: `msg-err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ 요청을 처리하는 중 오류가 발생했습니다: ${err?.message || '알 수 없는 에러'}`,
            timestamp: Date.now(),
            isError: true,
          };

          set((state) => ({
            messages: [...state.messages, errorMsg],
            isThinking: false,
          }));
        }
      },

      executeAction: async (actionId: string, isAuto = false) => {
        const state = get();
        let targetAction: ChatbotAction | undefined;
        let targetMsgIndex = -1;
        let targetActionIndex = -1;

        state.messages.forEach((msg, mIdx) => {
          msg.actions?.forEach((act, aIdx) => {
            if (act.id === actionId) {
              targetAction = act;
              targetMsgIndex = mIdx;
              targetActionIndex = aIdx;
            }
          });
        });

        if (!targetAction || targetAction.status !== 'pending') return;

        // 상태를 'executing'으로 변경
        const updatedMessages = [...state.messages];
        const updatedMsg = { ...updatedMessages[targetMsgIndex] };
        const updatedActions = [...(updatedMsg.actions || [])];
        updatedActions[targetActionIndex] = {
          ...targetAction,
          status: 'executing',
          autoExecuted: isAuto || targetAction.autoExecuted,
        };
        updatedMsg.actions = updatedActions;
        updatedMessages[targetMsgIndex] = updatedMsg;
        set({ messages: updatedMessages });

        try {
          const result = await executeChatbotAction(targetAction);

          // 완료 결과 반영
          const finalMessages = [...get().messages];
          const finalMsg = { ...finalMessages[targetMsgIndex] };
          const finalActions = [...(finalMsg.actions || [])];
          finalActions[targetActionIndex] = {
            ...targetAction,
            status: result.success ? 'completed' : 'failed',
            autoExecuted: isAuto || targetAction.autoExecuted,
            result: result.result,
          };
          finalMsg.actions = finalActions;
          finalMessages[targetMsgIndex] = finalMsg;

          // 결과 피드백 메시지 추가
          finalMessages.push({
            id: `msg-action-result-${Date.now()}`,
            role: 'assistant',
            content: isAuto ? `⚡ **[Auto Mode 자동 실행]** ${result.message}` : result.message,
            timestamp: Date.now(),
          });

          set({ messages: finalMessages });
        } catch (err: any) {
          const failMessages = [...get().messages];
          const failMsg = { ...failMessages[targetMsgIndex] };
          const failActions = [...(failMsg.actions || [])];
          failActions[targetActionIndex] = {
            ...targetAction,
            status: 'failed',
            autoExecuted: isAuto || targetAction.autoExecuted,
          };
          failMsg.actions = failActions;
          failMessages[targetMsgIndex] = failMsg;

          failMessages.push({
            id: `msg-action-fail-${Date.now()}`,
            role: 'assistant',
            content: isAuto
              ? `⚡ **[Auto Mode]** ❌ 기능 자동 실행에 실패했습니다: ${err?.message || '권한 부족 또는 네트워크 에러'}`
              : `❌ 기능 실행에 실패했습니다: ${err?.message || '권한 부족 또는 네트워크 에러'}`,
            timestamp: Date.now(),
            isError: true,
          });

          set({ messages: failMessages });
        }
      },

      executeAllActions: async (actionIds: string[]) => {
        if (actionIds.length === 0) return;
        const state = get();

        const targets: { action: ChatbotAction; msgIndex: number; actionIndex: number }[] = [];
        state.messages.forEach((msg, mIdx) => {
          msg.actions?.forEach((act, aIdx) => {
            if (actionIds.includes(act.id) && act.status === 'pending') {
              targets.push({ action: act, msgIndex: mIdx, actionIndex: aIdx });
            }
          });
        });

        if (targets.length === 0) return;

        // 모든 대상을 'executing' 상태로 전환
        let updatedMessages = [...get().messages];
        targets.forEach(({ msgIndex, actionIndex, action }) => {
          const msg = { ...updatedMessages[msgIndex] };
          const acts = [...(msg.actions || [])];
          acts[actionIndex] = { ...action, status: 'executing' };
          msg.actions = acts;
          updatedMessages[msgIndex] = msg;
        });
        set({ messages: updatedMessages });

        // 병렬 동시 실행
        const results = await Promise.all(
          targets.map(async ({ action }) => {
            try {
              const res = await executeChatbotAction(action);
              return { id: action.id, success: res.success, message: res.message, result: res.result };
            } catch (err: any) {
              return { id: action.id, success: false, message: err?.message || '실행 실패', result: null };
            }
          })
        );

        // 결과 일괄 반영
        updatedMessages = [...get().messages];
        const resultMap = new Map(results.map((r) => [r.id, r]));

        targets.forEach(({ msgIndex, actionIndex, action }) => {
          const res = resultMap.get(action.id);
          const msg = { ...updatedMessages[msgIndex] };
          const acts = [...(msg.actions || [])];
          acts[actionIndex] = {
            ...action,
            status: res?.success ? 'completed' : 'failed',
            result: res?.result,
          };
          msg.actions = acts;
          updatedMessages[msgIndex] = msg;
        });

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;
        const summaryHeader = failCount === 0
          ? `⚡ **[일괄 실행 완료]** 총 ${results.length}개의 작업이 모두 성공적으로 실행되었습니다!`
          : `⚡ **[일괄 실행 결과]** 총 ${results.length}개 중 ${successCount}개 성공, ${failCount}개 실패`;

        const detailLines = results.map((r) => `- ${r.success ? '✅' : '❌'} ${r.message}`).join('\n');

        updatedMessages.push({
          id: `msg-batch-result-${Date.now()}`,
          role: 'assistant',
          content: `${summaryHeader}\n\n${detailLines}`,
          timestamp: Date.now(),
        });

        set({ messages: updatedMessages });
      },

      clearMessages: () => {
        set({ messages: INITIAL_MESSAGES });
      },
    }),
    {
      name: 'ag_chatbot_state',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        selectedModel: s.selectedModel,
        autoExecute: s.autoExecute,
        messages: s.messages,
      }),
    }
  )
);
