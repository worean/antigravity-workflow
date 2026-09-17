/**
 * Chatbot Domain Types & Interfaces
 */

export type ChatbotModel = 'gpt-4o-mini' | '5.6-terra' | 'gemini-1.5-flash' | 'claude-3.5-sonnet' | 'gpt-4o';

export interface ChatbotModelOption {
  id: ChatbotModel;
  name: string;
  provider: 'OpenAI' | 'Google' | 'Anthropic';
  description: string;
}

export type ChatbotRole = 'user' | 'assistant' | 'system';

export type ChatbotActionType = 
  | 'create_issue'
  | 'update_issue'
  | 'delete_issue'
  | 'search_issues'
  | 'get_issue_detail'
  | 'create_project'
  | 'delete_project'
  | 'search_projects'
  | 'create_sprint'
  | 'search_sprints'
  | 'update_sprint'
  | 'get_sprint_summary'
  | 'navigate';

export interface ChatbotAction {
  id: string;
  type: ChatbotActionType;
  title: string;
  payload: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  autoExecuted?: boolean;
  result?: any;
}

export interface ChatTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostKrw: number;
}

export interface ChatbotAgentStep {
  tool: string;
  title: string;
  resultSummary?: string;
}

export interface ChatbotMessage {
  id: string;
  role: ChatbotRole;
  content: string;
  timestamp: number;
  actions?: ChatbotAction[];
  steps?: ChatbotAgentStep[];
  isError?: boolean;
  usage?: ChatTokenUsage;
}

export interface ChatbotSuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}
